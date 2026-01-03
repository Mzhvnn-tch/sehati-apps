import {
  users,
  medicalRecords,
  accessGrants,
  auditLogs,
  type User,
  type InsertUser,
  type InsertMedicalRecord,
  type MedicalRecord,
  type AccessGrant,
  type InsertAccessGrant,
  type AuditLog,
  type InsertAuditLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByWallet(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getPendingDoctors(): Promise<User[]>;
  verifyUser(userId: string): Promise<User | undefined>;

  // Medical record operations
  getMedicalRecord(id: string): Promise<MedicalRecord | undefined>;
  getMedicalRecordsByPatient(patientId: string): Promise<MedicalRecord[]>;
  createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord>;

  // Access grant operations
  createAccessGrant(grant: InsertAccessGrant): Promise<AccessGrant>;
  getAccessGrant(id: string): Promise<AccessGrant | undefined>;
  getAccessGrantByToken(token: string): Promise<AccessGrant | undefined>;
  revokeAccessGrant(id: string): Promise<void>;
  getActiveAccessGrantsByPatient(patientId: string): Promise<AccessGrant[]>;

  // Audit log operations
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogsByUser(userId: string): Promise<AuditLog[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.walletAddress, walletAddress));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getPendingDoctors(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(and(eq(users.role, "doctor"), eq(users.isVerified, false)));
  }

  async verifyUser(userId: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ isVerified: true })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  // Medical record operations
  async getMedicalRecord(id: string): Promise<MedicalRecord | undefined> {
    const [record] = await db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.id, id));
    return record || undefined;
  }

  async getMedicalRecordsByPatient(
    patientId: string
  ): Promise<MedicalRecord[]> {
    return await db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.patientId, patientId))
      .orderBy(desc(medicalRecords.createdAt));
  }

  async createMedicalRecord(
    insertRecord: InsertMedicalRecord
  ): Promise<MedicalRecord> {
    const [record] = await db
      .insert(medicalRecords)
      .values(insertRecord)
      .returning();
    return record;
  }

  // Access grant operations
  async createAccessGrant(
    insertGrant: InsertAccessGrant
  ): Promise<AccessGrant> {
    const [grant] = await db
      .insert(accessGrants)
      .values(insertGrant)
      .returning();
    return grant;
  }

  async getAccessGrant(id: string): Promise<AccessGrant | undefined> {
    const [grant] = await db
      .select()
      .from(accessGrants)
      .where(eq(accessGrants.id, id));
    return grant || undefined;
  }

  async getAccessGrantByToken(token: string): Promise<AccessGrant | undefined> {
    const now = new Date();
    const [grant] = await db
      .select()
      .from(accessGrants)
      .where(
        and(
          eq(accessGrants.token, token),
          eq(accessGrants.isActive, true),
          gte(accessGrants.expiresAt, now)
        )
      );
    return grant || undefined;
  }

  async revokeAccessGrant(id: string): Promise<void> {
    await db
      .update(accessGrants)
      .set({ isActive: false })
      .where(eq(accessGrants.id, id));
  }

  async getActiveAccessGrantsByPatient(
    patientId: string
  ): Promise<AccessGrant[]> {
    const now = new Date();
    return await db
      .select()
      .from(accessGrants)
      .where(
        and(
          eq(accessGrants.patientId, patientId),
          eq(accessGrants.isActive, true),
          gte(accessGrants.expiresAt, now)
        )
      )
      .orderBy(desc(accessGrants.createdAt));
  }

  // Audit log operations
  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db.insert(auditLogs).values(insertLog).returning();
    return log;
  }

  async getAuditLogsByUser(userId: string): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.actorId, userId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(50);
  }
}

export const storage = new DatabaseStorage();
