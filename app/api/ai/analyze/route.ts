// app/api/ai/analyze/route.ts o pages/api/ai/analyze.ts
import { NextResponse } from "next/server";

// Forzar Node.js runtime
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json(); // Recibe JSON del frontend
    console.log("Body recibido:", body);

    // Aquí procesas lo que quieras, por ejemplo solo devolverlo
    return NextResponse.json({ ok: true, data: body }, {
      headers: {
        "Access-Control-Allow-Origin": "https://frontend-lovable.vercel.app",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Opcional: responder preflight OPTIONS
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      "Access-Control-Allow-Origin": "https://frontend-lovable.vercel.app",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
