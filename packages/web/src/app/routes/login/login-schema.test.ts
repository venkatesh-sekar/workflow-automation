import { describe, it, expect, vi } from 'vitest';

import { LoginSchema } from './login-schema';

describe('LoginSchema', () => {
  it('accepts valid email and team key', () => {
    const result = LoginSchema.safeParse({
      email: 'user@example.com',
      apiKey: 'flow_abc123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty email', () => {
    const result = LoginSchema.safeParse({
      email: '',
      apiKey: 'flow_abc123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email format', () => {
    const result = LoginSchema.safeParse({
      email: 'not-an-email',
      apiKey: 'flow_abc123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects email without domain', () => {
    const result = LoginSchema.safeParse({
      email: 'user@',
      apiKey: 'flow_abc123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty team key', () => {
    const result = LoginSchema.safeParse({
      email: 'user@example.com',
      apiKey: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts any non-empty team key format', () => {
    const result = LoginSchema.safeParse({
      email: 'user@example.com',
      apiKey: 'any-key-value',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing fields', () => {
    const result = LoginSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
