import { describe, it, expect } from 'vitest';
import { registerSchema, resetPasswordSchema } from './validationSchemas';

describe('Password and Phone Validation Schema Tests', () => {
  const validPasswords = [
    'dadi',
    'dadi123',
    '123456',
    'shashaank',
    'user123',
    'pharmacy',
    'MediFind',
    '2026',
  ];

  const invalidPasswords = [
    'abc@123',      // contains special char '@'
    'password!123', // contains special char '!'
    'dadi#99',      // contains special char '#'
    'pass word',    // contains spaces
    '',             // empty
  ];

  validPasswords.forEach((pw) => {
    it(`accepts valid password: "${pw}"`, async () => {
      const valid = await registerSchema.isValid({
        fullName: 'Test User',
        email: 'user@example.com',
        phone: '9876543210',
        password: pw,
        confirmPassword: pw,
      });
      expect(valid).toBe(true);
    });
  });

  invalidPasswords.forEach((pw) => {
    it(`rejects invalid password: "${pw}"`, async () => {
      const valid = await registerSchema.isValid({
        fullName: 'Test User',
        email: 'user@example.com',
        phone: '9876543210',
        password: pw,
        confirmPassword: pw,
      });
      expect(valid).toBe(false);
    });
  });

  it('rejects registration when phone is missing or blank', async () => {
    const withoutPhone = await registerSchema.isValid({
      fullName: 'Test User',
      email: 'user@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(withoutPhone).toBe(false);

    const blankPhone = await registerSchema.isValid({
      fullName: 'Test User',
      email: 'user@example.com',
      phone: '   ',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(blankPhone).toBe(false);
  });

  it('rejects registration when phone is malformed', async () => {
    const invalidPhones = ['12345', '987654321', 'abcdefghij', '5876543210'];
    for (const p of invalidPhones) {
      const valid = await registerSchema.isValid({
        fullName: 'Test User',
        email: 'user@example.com',
        phone: p,
        password: 'password123',
        confirmPassword: 'password123',
      });
      expect(valid).toBe(false);
    }
  });

  it('accepts registration with valid Indian phone numbers and prefixes', async () => {
    const validPhones = ['9876543210', '+91 9876543210', '+91-9876543210', '+919876543210', '09876543210'];
    for (const p of validPhones) {
      const valid = await registerSchema.isValid({
        fullName: 'Test User',
        email: 'user@example.com',
        phone: p,
        password: 'password123',
        confirmPassword: 'password123',
      });
      expect(valid).toBe(true);
    }
  });

  it('validates resetPasswordSchema with alphanumeric passwords', async () => {
    const valid = await resetPasswordSchema.isValid({
      newPassword: 'pharmacy2026',
      confirmPassword: 'pharmacy2026',
    });
    expect(valid).toBe(true);
  });
});
