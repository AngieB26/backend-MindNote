import { NextRequest, NextResponse } from 'next/server';
import { deleteCookie } from '../../../lib/security';

const CORS_ORIGIN = 'http://localhost:8080';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': CORS_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function POST(req: NextRequest) {
  // Delete session and CSRF cookies
  const sessionCookie = deleteCookie('session');
  const csrfCookie = deleteCookie('csrf-token');

  return NextResponse.json(
    { success: true, message: 'Logged out successfully' },
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': CORS_ORIGIN,
        'Access-Control-Allow-Credentials': 'true',
        'Set-Cookie': [sessionCookie, csrfCookie].join(', '),
      },
    }
  );
}
