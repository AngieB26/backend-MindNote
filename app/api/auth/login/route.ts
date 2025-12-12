import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma';
import {
  verifyPassword,
  sanitizeEmail,
  createSecureCookie,
  generateCSRFToken,
} from '../../../lib/security';
import { withSecureCors } from '../../../lib/middleware';
import { checkRateLimit, getRateLimitIdentifier } from '../../../lib/security';

const CORS_ORIGIN = 'http://localhost:8080';

// Validation schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
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
      maxRequests: 10, // 10 login attempts per 15 minutes
    });

    if (!rateLimit.allowed) {
      return withSecureCors(
        {
          error: 'Too many login attempts',
          message: 'Please wait before trying again',
          retryAfter: new Date(rateLimit.resetTime).toISOString(),
        },
        { status: 429 },
        CORS_ORIGIN
      );
    }

    // ============== PARSE AND VALIDATE ==============
    const body = await req.json();
    const validated = loginSchema.parse(body);

    // ============== SANITIZE INPUT ==============
    const email = sanitizeEmail(validated.email);

    if (!email) {
      return withSecureCors(
        { error: 'Invalid email format' },
        { status: 400 },
        CORS_ORIGIN
      );
    }

    // ============== FIND USER ==============
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Generic error to prevent user enumeration
      return withSecureCors(
        { error: 'Invalid credentials' },
        { status: 401 },
        CORS_ORIGIN
      );
    }

    // ============== VERIFY PASSWORD ==============
    const isValidPassword = await verifyPassword(validated.password, user.password);

    if (!isValidPassword) {
      return withSecureCors(
        { error: 'Invalid credentials' },
        { status: 401 },
        CORS_ORIGIN
      );
    }

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
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
        csrfToken, // Send CSRF token in response for client to store
      },
      {
        status: 200,
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

    console.error('Login error:', error);
    return withSecureCors(
      { error: 'Internal server error' },
      { status: 500 },
      CORS_ORIGIN
    );
  }
}
