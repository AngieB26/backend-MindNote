import type { NextFetchEvent, NextRequest } from 'next/server';

export function proxy(request: NextRequest, event: NextFetchEvent) {
  return fetch(request)
    .then((response) => {
      const headers = new Headers(response.headers);

      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    });
}
