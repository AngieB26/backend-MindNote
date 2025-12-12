import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // Permitir solo tu frontend en producción
    const origin = req.headers.get('origin') || '';
    const allowedOrigin = origin && origin.length > 0 ? origin : '';

  // Responder directamente a preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204, // No Content
      headers: {
          ...(allowedOrigin ? { 'Access-Control-Allow-Origin': allowedOrigin } : {}),
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
      },
    });
  }

  // Para cualquier otra request, devolver normalmente con headers CORS
  const res = NextResponse.next();
    if (allowedOrigin) {
      res.headers.set('Access-Control-Allow-Origin', allowedOrigin);
    }
  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.headers.set('Access-Control-Allow-Credentials', 'true');

  return res;
}

// Solo aplica a rutas /api/*
export const config = {
  matcher: '/api/:path*',
};
