import bcrypt from 'bcryptjs';
import validator from 'validator';
import { serialize, parse } from 'cookie';
import { NextRequest } from 'next/server';

// ============== BCRYPT ENCRYPTION ==============
const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// ============== INPUT SANITIZATION ==============
export function sanitizeInput(input: string): string {
  // Escape HTML to prevent XSS
  let sanitized = validator.escape(input);
  
  // Remove any potential SQL injection patterns
  sanitized = sanitized.replace(/('|(--)|;|\/\*|\*\/)/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
}

export function sanitizeEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  if (!validator.isEmail(trimmed)) return null;
  const normalized = validator.normalizeEmail(trimmed);
  return normalized || null;
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = {} as T;
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeInput(value) as T[keyof T];
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key as keyof T] = sanitizeObject(value as Record<string, unknown>) as T[keyof T];
    } else {
      sanitized[key as keyof T] = value as T[keyof T];
    }
  }
  
  return sanitized;
}

// ============== SECURE COOKIES ==============
interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
  path?: string;
}

export function createSecureCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
): string {
  const defaultOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    ...options,
  };

  return serialize(name, value, defaultOptions);
}

export function parseCookies(req: NextRequest): Record<string, string> {
  const cookieHeader = req.headers.get('cookie') || '';
  const cookies = parse(cookieHeader);
  // Convert to Record<string, string> by filtering undefined values
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(cookies)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

export function deleteCookie(name: string): string {
  return serialize(name, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
}

// ============== CSRF PROTECTION ==============
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function verifyCSRFToken(token: string, storedToken: string): boolean {
  if (!token || !storedToken) return false;
  
  // Constant-time comparison to prevent timing attacks
  if (token.length !== storedToken.length) return false;
  
  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ storedToken.charCodeAt(i);
  }
  
  return result === 0;
}

// ============== RATE LIMITING ==============
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs?: number;  // Time window in milliseconds
  maxRequests?: number;  // Max requests per window
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = {}
): { allowed: boolean; remaining: number; resetTime: number } {
  const windowMs = config.windowMs || 60000; // 1 minute default
  const maxRequests = config.maxRequests || 60; // 60 requests per minute default
  
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);
  
  // Clean up old entries periodically
  if (Math.random() < 0.01) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }
  
  if (!entry || entry.resetTime < now) {
    // Create new entry
    const resetTime = now + windowMs;
    rateLimitStore.set(identifier, { count: 1, resetTime });
    return { allowed: true, remaining: maxRequests - 1, resetTime };
  }
  
  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }
  
  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, resetTime: entry.resetTime };
}

export function getRateLimitIdentifier(req: NextRequest): string {
  // Try to get IP from various headers
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  // Fallback to a default if no IP found
  return 'unknown';
}

// ============== VALIDATION HELPERS ==============
export function isValidPassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  return { valid: true };
}

export function isValidUsername(username: string): boolean {
  return validator.isAlphanumeric(username) && username.length >= 3 && username.length <= 20;
}
