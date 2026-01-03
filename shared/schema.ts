import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (represents both patients and doctors)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull(), // "patient" or "doctor"
  gender: text("gender").notNull(), // "male", "female", "other"
  bloodType: text("blood_type"),
  allergies: text("allergies").array(),
  age: integer("age").notNull(),
  hospital: text("hospital"), // For doctors - where they practice
  publicKey: text("public_key"), // For encryption
  isVerified: boolean("is_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Medical Records table
export const medicalRecords = pgTable("medical_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => users.id),
  doctorId: varchar("doctor_id").notNull().references(() => users.id),
  hospitalName: text("hospital_name").notNull(),
  recordType: text("record_type").notNull(), // "lab_result", "diagnosis", "prescription"
  title: text("title").notNull(),
  encryptedContent: text("encrypted_content").notNull(), // AES encrypted medical data
  ipfsHash: text("ipfs_hash"), // Simulated IPFS hash
  blockchainHash: text("blockchain_hash"), // Simulated blockchain transaction hash
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMedicalRecordSchema = createInsertSchema(medicalRecords).omit({
  id: true,
  createdAt: true,
});

export type InsertMedicalRecord = z.infer<typeof insertMedicalRecordSchema>;
export type MedicalRecord = typeof medicalRecords.$inferSelect;

// Access Grants table (for QR-based temporary access)
export const accessGrants = pgTable("access_grants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(), // The QR code contains this token
  encryptionKey: text("encryption_key").notNull(), // Temporary decryption key
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAccessGrantSchema = createInsertSchema(accessGrants).omit({
  id: true,
  createdAt: true,
});

export type InsertAccessGrant = z.infer<typeof insertAccessGrantSchema>;
export type AccessGrant = typeof accessGrants.$inferSelect;

// Audit Logs table (blockchain-like event logging)
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actorId: varchar("actor_id").notNull().references(() => users.id),
  targetId: varchar("target_id"), // Can be userId or recordId
  action: text("action").notNull(), // "RecordAdded", "AccessGranted", "RecordViewed", etc.
  entityType: text("entity_type").notNull(), // "record", "access", "user"
  metadata: text("metadata"), // JSON string for additional context
  transactionHash: text("transaction_hash"), // Simulated blockchain tx hash
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
