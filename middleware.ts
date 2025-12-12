import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  try {
    const origin = req.headers.get("origin") || "";

    const allowedOrigins = [
      "https://frontend-lovable.vercel.app",
      "http://localhost:3000"
    ];

    const isAllowed = allowedOrigins.includes(origin);

    // Preflight (OPTIONS)
    if (req.method === "OPTIONS") {
      const res = new NextResponse(null, { status: 200 });
      res.headers.set(
        "Access-Control-Allow-Origin",
        isAllowed ? origin : allowedOrigins[0]
      );
      res.headers.set(
        "Access-Control-Allow-Methods",
        "GET,POST,PUT,DELETE,OPTIONS"
      );
      res.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );
      res.headers.set("Access-Control-Allow-Credentials", "true");
      return res;
    }

    // Para cualquier otra request
    const res = NextResponse.next();
    res.headers.set(
      "Access-Control-Allow-Origin",
      isAllowed ? origin : allowedOrigins[0]
    );
    res.headers.set(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,OPTIONS"
    );
    res.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    res.headers.set("Access-Control-Allow-Credentials", "true");

    return res;
  } catch (error) {
    // En caso de error en middleware → no romper backend
    console.error("Middleware error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: "/api/:path*",
};
