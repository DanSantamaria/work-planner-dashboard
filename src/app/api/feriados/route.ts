import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPrismaError } from "@/lib/prisma-errors";
import { requireRole } from "@/lib/api-auth";

export async function GET() {
  try {
    const feriados = await prisma.feriado.findMany({
      orderBy: { fecha: "asc" },
    });

    return NextResponse.json(feriados, { status: 200 });
  } catch (error) {
    console.error("Error al obtener feriados:", error);
    return NextResponse.json(
      { error: "No se pudieron obtener los feriados" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { response } = await requireRole(["ADMIN", "SUPERVISOR"]);
  if (response) return response;

  try {
    const body = await request.json();
    const { fecha, nombre } = body;

    if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
      return NextResponse.json(
        { error: "El nombre del feriado es obligatorio" },
        { status: 400 }
      );
    }

    const fechaParsed = new Date(fecha);
    if (!fecha || isNaN(fechaParsed.getTime())) {
      return NextResponse.json(
        { error: "La fecha del feriado no es válida" },
        { status: 400 }
      );
    }

    const feriado = await prisma.feriado.create({
      data: {
        fecha: fechaParsed,
        nombre: nombre.trim(),
      },
    });

    return NextResponse.json(feriado, { status: 201 });
  } catch (error: unknown) {
    if (isPrismaError(error, "P2002")) {
      return NextResponse.json(
        { error: "Ya existe un feriado en esa fecha" },
        { status: 409 }
      );
    }

    console.error("Error al crear feriado:", error);
    return NextResponse.json(
      { error: "No se pudo crear el feriado" },
      { status: 500 }
    );
  }
}
