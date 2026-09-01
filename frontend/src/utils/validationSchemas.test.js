import { describe, it, expect } from 'vitest';
import { registerSchema, resetPasswordSchema } from './validationSchemas';

describe('Password Validation Schema Tests', () => {
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
        password: pw,
        confirmPassword: pw,
      });
      expect(valid).toBe(false);
    });
  });

  it('validates resetPasswordSchema with alphanumeric passwords', async () => {
    const valid = await resetPasswordSchema.isValid({
      newPassword: 'pharmacy2026',
      confirmPassword: 'pharmacy2026',
    });
    expect(valid).toBe(true);
  });
});
