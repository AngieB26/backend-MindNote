import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs"; // Forzar Node runtime

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Ejemplo: almacenar en DB con Prisma
    // const newRecord = await prisma.message.create({ data: { text: body.mensaje } });

    return NextResponse.json({
      ok: true,
      data: body,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
