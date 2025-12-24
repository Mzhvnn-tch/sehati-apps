import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

const walletAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address');

export const userRegistrationSchema = z.object({
  walletAddress: walletAddressSchema,
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-'.]+$/, 'Name contains invalid characters'),
  role: z.enum(['patient', 'doctor'], { 
    errorMap: () => ({ message: 'Role must be either patient or doctor' })
  }),
  gender: z.enum(['male', 'female', 'other'], {
    errorMap: () => ({ message: 'Gender must be male, female, or other' })
  }),
  age: z.number().int().min(1, 'Age is required').max(150, 'Age must be less than 150'),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).nullable().optional(),
  allergies: z.array(z.string().max(100)).nullable().optional(),
  hospital: z.string().max(200).nullable().optional(),
});

export const userUpdateSchema = z.object({
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).nullable().optional(),
  allergies: z.array(z.string().max(100)).nullable().optional(),
  age: z.number().int().min(0).max(150).nullable().optional(),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .optional(),
});

export const medicalRecordSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID'),
  doctorId: z.string().uuid('Invalid doctor ID'),
  hospitalName: z.string()
    .min(2, 'Hospital name must be at least 2 characters')
    .max(200, 'Hospital name must be less than 200 characters'),
  recordType: z.enum(['lab_result', 'diagnosis', 'prescription', 'vaccination', 'imaging', 'procedure'], {
    errorMap: () => ({ message: 'Invalid record type' })
  }),
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be less than 200 characters'),
  content: z.string()
    .min(10, 'Content must be at least 10 characters')
    .max(10000, 'Content must be less than 10000 characters'),
});

export const accessGrantSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID'),
  durationMinutes: z.number()
    .int()
    .min(5, 'Duration must be at least 5 minutes')
    .max(1440, 'Duration must be less than 24 hours (1440 minutes)')
    .default(60),
});

export const accessValidateSchema = z.object({
  token: z.string()
    .min(32, 'Invalid token format')
    .max(128, 'Invalid token format'),
  doctorId: z.string().uuid('Invalid doctor ID').optional(),
});

export const decryptRecordSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

export const validate = <T extends z.ZodType>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        return res.status(400).json({ 
          error: 'Validation failed',
          details: errors 
        });
      }
      
      req.body = result.data;
      next();
    } catch (error) {
      return res.status(400).json({ error: 'Invalid request data' });
    }
  };
};

export const validateParams = <T extends z.ZodType>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.params);
      
      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        return res.status(400).json({ 
          error: 'Invalid parameters',
          details: errors 
        });
      }
      
      next();
    } catch (error) {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }
  };
};

export const uuidParamSchema = z.object({
  userId: z.string().uuid('Invalid user ID').optional(),
  patientId: z.string().uuid('Invalid patient ID').optional(),
  recordId: z.string().uuid('Invalid record ID').optional(),
  grantId: z.string().uuid('Invalid grant ID').optional(),
});

export const walletParamSchema = z.object({
  walletAddress: walletAddressSchema,
});
