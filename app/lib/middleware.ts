import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitIdentifier, verifyCSRFToken, parseCookies } from './security';

export interface SecurityConfig {
  rateLimit?: {
    windowMs?: number;
    maxRequests?: number;
  };
  requireCSRF?: boolean;
  requireAuth?: boolean;
}

export function withSecurity(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse,
  config: SecurityConfig = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // ============== RATE LIMITING ==============
    if (config.rateLimit !== undefined) {
      const identifier = getRateLimitIdentifier(req);
      const rateLimit = checkRateLimit(identifier, config.rateLimit);
      
      if (!rateLimit.allowed) {
        const resetDate = new Date(rateLimit.resetTime).toISOString();
        return NextResponse.json(
          {
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: resetDate,
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': config.rateLimit?.maxRequests?.toString() || '60',
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': resetDate,
              'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
            },
          }
        );
      }
      
      // Add rate limit headers to response
      const response = await handler(req);
      response.headers.set('X-RateLimit-Limit', config.rateLimit?.maxRequests?.toString() || '60');
      response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
      response.headers.set('X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString());
      
      return response;
    }
    
    // ============== CSRF PROTECTION ==============
    if (config.requireCSRF && req.method !== 'GET') {
      const csrfToken = req.headers.get('x-csrf-token');
      const cookies = parseCookies(req);
      const storedToken = cookies['csrf-token'];
      
      if (!csrfToken || !storedToken || !verifyCSRFToken(csrfToken, storedToken)) {
        return NextResponse.json(
          {
            error: 'Invalid CSRF token',
            message: 'CSRF token is missing or invalid',
          },
          { status: 403 }
        );
      }
    }
    
    return handler(req);
  };
}

// ============== CORS WITH SECURITY ==============
export function withSecureCors(
  json: Record<string, unknown>,
  init?: ResponseInit,
  allowedOrigin: string = 'http://localhost:8080'
) {
  return NextResponse.json(json, {
    ...(init ?? {}),
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      ...(init?.headers ?? {}),
    },
  });
}
