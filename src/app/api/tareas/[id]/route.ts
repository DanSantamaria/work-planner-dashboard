import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPrismaError } from "@/lib/prisma-errors";
import { requireRole } from "@/lib/api-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, { params }: RouteContext) {
  const { response } = await requireRole(["ADMIN", "SUPERVISOR"]);
  if (response) return response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { nombre, descripcion, activa } = body;

    if (
      nombre !== undefined &&
      (typeof nombre !== "string" || !nombre.trim())
    ) {
      return NextResponse.json(
        { error: "El nombre de la tarea no puede estar vacío" },
        { status: 400 }
      );
    }

    const tarea = await prisma.tarea.update({
      where: { id },
      data: {
        ...(nombre !== undefined && { nombre: nombre.trim() }),
        ...(descripcion !== undefined && {
          descripcion: descripcion?.trim() || null,
        }),
        ...(activa !== undefined && { activa }),
      },
    });

    return NextResponse.json(tarea, { status: 200 });
  } catch (error: unknown) {
    if (isPrismaError(error, "P2025")) {
      return NextResponse.json(
        { error: "Tarea no encontrada" },
        { status: 404 }
      );
    }

    if (isPrismaError(error, "P2002")) {
      return NextResponse.json(
        { error: "Ya existe una tarea con ese nombre" },
        { status: 409 }
      );
    }

    console.error("Error al actualizar tarea:", error);
    return NextResponse.json(
      { error: "No se pudo actualizar la tarea" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { response } = await requireRole(["ADMIN", "SUPERVISOR"]);
  if (response) return response;

  try {
    const { id } = await params;

    const tarea = await prisma.tarea.update({
      where: { id },
      data: { activa: false },
    });

    return NextResponse.json(tarea, { status: 200 });
  } catch (error: unknown) {
    if (isPrismaError(error, "P2025")) {
      return NextResponse.json(
        { error: "Tarea no encontrada" },
        { status: 404 }
      );
    }

    console.error("Error al eliminar tarea:", error);
    return NextResponse.json(
      { error: "No se pudo eliminar la tarea" },
      { status: 500 }
    );
  }
}
