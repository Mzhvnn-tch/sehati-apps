import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

// Derive a key from a password using PBKDF2
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, "sha256");
}

// Generate a random encryption key (for temporary access grants)
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Generate a random token (for QR codes)
export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Encrypt data using AES-256-GCM
export function encrypt(plaintext: string, password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(password, salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const tag = cipher.getAuthTag();
  
  // Combine salt + iv + tag + encrypted data
  const result = Buffer.concat([salt, iv, tag, Buffer.from(encrypted, "hex")]);
  return result.toString("base64");
}

// Decrypt data using AES-256-GCM
export function decrypt(encryptedData: string, password: string): string {
  const buffer = Buffer.from(encryptedData, "base64");
  
  const salt = buffer.subarray(0, SALT_LENGTH);
  const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = buffer.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + TAG_LENGTH
  );
  const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  
  const key = deriveKey(password, salt);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encrypted.toString("hex"), "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}

// Generate simulated blockchain transaction hash
export function generateBlockchainHash(): string {
  return "0x" + crypto.randomBytes(32).toString("hex");
}

// Generate simulated IPFS hash (using CID v1 format)
export function generateIPFSHash(): string {
  const randomHash = crypto.randomBytes(32).toString("hex");
  return `Qm${randomHash.substring(0, 44)}`;
}

// Simulate wallet address format (Ethereum-style)
export function formatWalletAddress(userId: string): string {
  const hash = crypto.createHash("sha256").update(userId).digest("hex");
  return `0x${hash.substring(0, 40)}`;
}
