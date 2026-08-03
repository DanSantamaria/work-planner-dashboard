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
    const { nombre, orden } = body;

    if (
      nombre !== undefined &&
      (typeof nombre !== "string" || !nombre.trim())
    ) {
      return NextResponse.json(
        { error: "El nombre del grupo no puede estar vacío" },
        { status: 400 }
      );
    }

    if (orden !== undefined && (typeof orden !== "number" || orden < 0)) {
      return NextResponse.json(
        { error: "El orden debe ser un número mayor o igual a cero" },
        { status: 400 }
      );
    }

    const grupo = await prisma.grupo.update({
      where: { id },
      data: {
        ...(nombre !== undefined && { nombre: nombre.trim() }),
        ...(orden !== undefined && { orden }),
      },
    });

    return NextResponse.json(grupo, { status: 200 });
  } catch (error: unknown) {
    if (isPrismaError(error, "P2025")) {
      return NextResponse.json(
        { error: "Grupo no encontrado" },
        { status: 404 }
      );
    }

    if (isPrismaError(error, "P2002")) {
      return NextResponse.json(
        { error: "Ya existe un grupo con ese nombre" },
        { status: 409 }
      );
    }

    console.error("Error al actualizar grupo:", error);
    return NextResponse.json(
      { error: "No se pudo actualizar el grupo" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { response } = await requireRole(["ADMIN", "SUPERVISOR"]);
  if (response) return response;

  try {
    const { id } = await params;

    await prisma.grupo.delete({ where: { id } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    if (isPrismaError(error, "P2025")) {
      return NextResponse.json(
        { error: "Grupo no encontrado" },
        { status: 404 }
      );
    }

    console.error("Error al eliminar grupo:", error);
    return NextResponse.json(
      { error: "No se pudo eliminar el grupo" },
      { status: 500 }
    );
  }
}
