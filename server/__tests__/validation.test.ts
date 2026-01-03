import { describe, it, expect } from 'vitest';
import {
  userRegistrationSchema,
  userUpdateSchema,
  medicalRecordSchema,
  accessGrantSchema,
  accessValidateSchema,
} from '../middleware/validation';

describe('Validation Schemas', () => {
  describe('userRegistrationSchema', () => {
    it('should accept valid patient registration data', () => {
      const validData = {
        walletAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        name: 'John Doe',
        role: 'patient',
      };
      
      const result = userRegistrationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept valid doctor registration data', () => {
      const validData = {
        walletAddress: '0xABCD1234567890abcdef1234567890ABCDEF1234',
        name: 'Dr. Strange',
        role: 'doctor',
      };
      
      const result = userRegistrationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid wallet address', () => {
      const invalidData = {
        walletAddress: 'invalid-address',
        name: 'John Doe',
        role: 'patient',
      };
      
      const result = userRegistrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid role', () => {
      const invalidData = {
        walletAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        name: 'John Doe',
        role: 'admin',
      };
      
      const result = userRegistrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty name', () => {
      const invalidData = {
        walletAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        name: '',
        role: 'patient',
      };
      
      const result = userRegistrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept optional health data', () => {
      const validData = {
        walletAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        name: 'John Doe',
        role: 'patient',
        bloodType: 'O+',
        allergies: ['Penicillin', 'Peanuts'],
        age: 35,
      };
      
      const result = userRegistrationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('userUpdateSchema', () => {
    it('should accept valid update data', () => {
      const validData = {
        bloodType: 'A-',
        age: 40,
      };
      
      const result = userUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid blood type', () => {
      const invalidData = {
        bloodType: 'X+',
      };
      
      const result = userUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid age', () => {
      const invalidData = {
        age: -5,
      };
      
      const result = userUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('medicalRecordSchema', () => {
    it('should accept valid medical record data', () => {
      const validData = {
        patientId: '550e8400-e29b-41d4-a716-446655440000',
        doctorId: '550e8400-e29b-41d4-a716-446655440001',
        hospitalName: 'General Hospital',
        recordType: 'diagnosis',
        title: 'Annual Checkup Results',
        content: 'Patient is in good health. All vitals are normal.',
      };
      
      const result = medicalRecordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid record type', () => {
      const invalidData = {
        patientId: '550e8400-e29b-41d4-a716-446655440000',
        doctorId: '550e8400-e29b-41d4-a716-446655440001',
        hospitalName: 'General Hospital',
        recordType: 'invalid_type',
        title: 'Annual Checkup',
        content: 'Some content here for the record.',
      };
      
      const result = medicalRecordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject short title', () => {
      const invalidData = {
        patientId: '550e8400-e29b-41d4-a716-446655440000',
        doctorId: '550e8400-e29b-41d4-a716-446655440001',
        hospitalName: 'General Hospital',
        recordType: 'diagnosis',
        title: 'Hi',
        content: 'Patient is in good health. All vitals are normal.',
      };
      
      const result = medicalRecordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('accessGrantSchema', () => {
    it('should accept valid access grant data', () => {
      const validData = {
        patientId: '550e8400-e29b-41d4-a716-446655440000',
        durationMinutes: 60,
      };
      
      const result = accessGrantSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should use default duration when not provided', () => {
      const validData = {
        patientId: '550e8400-e29b-41d4-a716-446655440000',
      };
      
      const result = accessGrantSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.durationMinutes).toBe(60);
      }
    });

    it('should reject too long duration', () => {
      const invalidData = {
        patientId: '550e8400-e29b-41d4-a716-446655440000',
        durationMinutes: 10000,
      };
      
      const result = accessGrantSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('accessValidateSchema', () => {
    it('should accept valid token', () => {
      const validData = {
        token: 'a'.repeat(64),
      };
      
      const result = accessValidateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject short token', () => {
      const invalidData = {
        token: 'short',
      };
      
      const result = accessValidateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
