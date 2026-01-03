import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import session from 'express-session';
import MemoryStore from 'memorystore';
import type { Request, Response, NextFunction, Express } from 'express';
import { storage } from '../storage';
import crypto from 'crypto';

const MemoryStoreSession = MemoryStore(session);

export const sessionStore = new MemoryStoreSession({
  checkPeriod: 86400000,
});

const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

export const sessionMiddleware = session({
  secret: SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store: sessionStore,
  cookie: {
    secure: process.env.NODE_ENV === 'production' && process.env.HTTPS === 'true',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax',
  },
});

declare module 'express-session' {
  interface SessionData {
    user: {
      id: string;
      walletAddress: string;
      role: string;
    };
    authenticated: boolean;
    verifiedWallet?: string;
  }
}

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !req.path.startsWith('/api'),
  validate: { xForwardedForHeader: false },
});

export const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

export const walletAuthLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many wallet connection attempts, please try again later.' },
  validate: { xForwardedForHeader: false },
});

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        walletAddress: string;
        role: string;
      };
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.authenticated || !req.session?.user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in with your wallet.' });
  }
  
  try {
    const user = await storage.getUserByWallet(req.session.user.walletAddress);
    
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: 'User not found. Session invalidated.' });
    }
    
    req.user = {
      id: user.id,
      walletAddress: user.walletAddress,
      role: user.role,
    };
    
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Authentication failed.' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    
    next();
  };
};

export const requirePatient = requireRole(['patient']);
export const requireDoctor = requireRole(['doctor']);
export const requirePatientOrDoctor = requireRole(['patient', 'doctor']);

export const validateWalletAddress = (req: Request, res: Response, next: NextFunction) => {
  const { walletAddress } = req.body;
  
  if (walletAddress) {
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethAddressRegex.test(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address format.' });
    }
  }
  
  next();
};

export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };
  
  req.body = sanitize(req.body);
  next();
};

export const setupSecurity = (app: Express) => {
  app.use(sessionMiddleware);
  
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        styleSrcElem: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        connectSrc: ["'self'", "wss:", "https:"],
        fontSrc: ["'self'", "https:", "https://fonts.gstatic.com", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  }));
  
  app.use(limiter);
  
  app.use(sanitizeInput);
  
  app.disable('x-powered-by');
  
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });
};
