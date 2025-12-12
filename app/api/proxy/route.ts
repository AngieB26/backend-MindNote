import { NextRequest, NextResponse } from "next/server";

// Forzar Node.js runtime
export const runtime = "nodejs";

// URL base del API al que quieres hacer proxy
const TARGET_API = "https://tu-api-remota.com";

export async function handler(req: NextRequest) {
  try {
    const url = TARGET_API + req.nextUrl.pathname; // Puedes ajustar path si quieres

    // Convertimos headers a objeto plano
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Obtener body (solo si no es GET/HEAD)
    let body: string | undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      body = await req.text();
    }

    // Hacer fetch a la API remota
    const response = await fetch(url, {
      method: req.method,
      headers,
      body,
    });

    // Copiar headers y agregar CORS
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    responseHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    const responseBody = await response.text();

    return new Response(responseBody, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("Proxy error:", err);
    return new Response(JSON.stringify({ error: "Internal proxy error" }), { status: 500 });
  }
}

// Redirigir todas las llamadas al handler
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const OPTIONS = handler;
