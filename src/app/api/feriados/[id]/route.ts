import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPrismaError } from "@/lib/prisma-errors";
import { requireRole } from "@/lib/api-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const { response } = await requireRole(["ADMIN", "SUPERVISOR"]);
  if (response) return response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { fecha, nombre } = body;

    if (
      nombre !== undefined &&
      (typeof nombre !== "string" || !nombre.trim())
    ) {
      return NextResponse.json(
        { error: "El nombre del feriado no puede estar vacío" },
        { status: 400 }
      );
    }

    let fechaParsed: Date | undefined;
    if (fecha !== undefined) {
      fechaParsed = new Date(fecha);
      if (isNaN(fechaParsed.getTime())) {
        return NextResponse.json(
          { error: "La fecha del feriado no es válida" },
          { status: 400 }
        );
      }
    }

    const feriado = await prisma.feriado.update({
      where: { id },
      data: {
        ...(fechaParsed !== undefined && { fecha: fechaParsed }),
        ...(nombre !== undefined && { nombre: nombre.trim() }),
      },
    });

    return NextResponse.json(feriado, { status: 200 });
  } catch (error: unknown) {
    if (isPrismaError(error, "P2025")) {
      return NextResponse.json(
        { error: "Feriado no encontrado" },
        { status: 404 }
      );
    }

    if (isPrismaError(error, "P2002")) {
      return NextResponse.json(
        { error: "Ya existe un feriado en esa fecha" },
        { status: 409 }
      );
    }

    console.error("Error al actualizar feriado:", error);
    return NextResponse.json(
      { error: "No se pudo actualizar el feriado" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { response } = await requireRole(["ADMIN", "SUPERVISOR"]);
  if (response) return response;

  try {
    const { id } = await params;

    await prisma.feriado.delete({ where: { id } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    if (isPrismaError(error, "P2025")) {
      return NextResponse.json(
        { error: "Feriado no encontrado" },
        { status: 404 }
      );
    }

    console.error("Error al eliminar feriado:", error);
    return NextResponse.json(
      { error: "No se pudo eliminar el feriado" },
      { status: 500 }
    );
  }
}
