import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma';
import {
  hashPassword,
  sanitizeEmail,
  sanitizeInput,
  isValidPassword,
  createSecureCookie,
  generateCSRFToken,
} from '../../../lib/security';
import { withSecureCors } from '../../../lib/middleware';
import { checkRateLimit, getRateLimitIdentifier } from '../../../lib/security';

const CORS_ORIGIN = 'http://localhost:8080';

// Validation schema
const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  password: z.string().min(8),
});

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': CORS_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-Token',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    // ============== RATE LIMITING ==============
    const identifier = getRateLimitIdentifier(req);
    const rateLimit = checkRateLimit(identifier, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 registration attempts per 15 minutes
    });

    if (!rateLimit.allowed) {
      return withSecureCors(
        {
          error: 'Too many registration attempts',
          message: 'Please wait before trying again',
          retryAfter: new Date(rateLimit.resetTime).toISOString(),
        },
        { status: 429 },
        CORS_ORIGIN
      );
    }

    // ============== PARSE AND VALIDATE ==============
    const body = await req.json();
    const validated = registerSchema.parse(body);

    // ============== SANITIZE INPUT ==============
    const email = sanitizeEmail(validated.email);
    const name = sanitizeInput(validated.name);

    if (!email) {
      return withSecureCors(
        { error: 'Invalid email format' },
        { status: 400 },
        CORS_ORIGIN
      );
    }

    // ============== PASSWORD VALIDATION ==============
    const passwordValidation = isValidPassword(validated.password);
    if (!passwordValidation.valid) {
      return withSecureCors(
        { error: passwordValidation.message },
        { status: 400 },
        CORS_ORIGIN
      );
    }

    // ============== CHECK EXISTING USER ==============
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return withSecureCors(
        { error: 'User already exists' },
        { status: 409 },
        CORS_ORIGIN
      );
    }

    // ============== HASH PASSWORD ==============
    const hashedPassword = await hashPassword(validated.password);

    // ============== CREATE USER ==============
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    // ============== GENERATE CSRF TOKEN ==============
    const csrfToken = generateCSRFToken();

    // ============== CREATE SECURE COOKIES ==============
    const sessionCookie = createSecureCookie('session', user.id, {
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    const csrfCookie = createSecureCookie('csrf-token', csrfToken, {
      maxAge: 60 * 60 * 24, // 24 hours
    });

    const response = withSecureCors(
      {
        success: true,
        user,
        csrfToken, // Send CSRF token in response for client to store
      },
      {
        status: 201,
        headers: {
          'Set-Cookie': [sessionCookie, csrfCookie].join(', '),
        },
      },
      CORS_ORIGIN
    );

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return withSecureCors(
        {
          error: 'Validation error',
          details: error.issues,
        },
        { status: 400 },
        CORS_ORIGIN
      );
    }

    console.error('Registration error:', error);
    return withSecureCors(
      { error: 'Internal server error' },
      { status: 500 },
      CORS_ORIGIN
    );
  }
}
