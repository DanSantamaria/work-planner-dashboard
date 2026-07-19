import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPrismaError } from "@/lib/prisma-errors";
import { LOB, Turno } from "@/generated/prisma/client";
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
    const { nombre, lob, turno, horario, activo } = body;

    if (
      nombre !== undefined &&
      (typeof nombre !== "string" || !nombre.trim())
    ) {
      return NextResponse.json(
        { error: "El nombre del empleado no puede estar vacío" },
        { status: 400 }
      );
    }

    if (lob !== undefined && !Object.values(LOB).includes(lob)) {
      return NextResponse.json({ error: "LOB inválido" }, { status: 400 });
    }

    if (turno !== undefined && !Object.values(Turno).includes(turno)) {
      return NextResponse.json({ error: "Turno inválido" }, { status: 400 });
    }

    const empleado = await prisma.empleado.update({
      where: { id },
      data: {
        ...(nombre !== undefined && { nombre: nombre.trim() }),
        ...(lob !== undefined && { lob }),
        ...(turno !== undefined && { turno }),
        ...(horario !== undefined && {
          horario: typeof horario === "string" ? horario.trim() : "",
        }),
        ...(activo !== undefined && { activo }),
      },
    });

    return NextResponse.json(empleado, { status: 200 });
  } catch (error: unknown) {
    if (isPrismaError(error, "P2025")) {
      return NextResponse.json(
        { error: "Empleado no encontrado" },
        { status: 404 }
      );
    }

    if (isPrismaError(error, "P2002")) {
      return NextResponse.json(
        { error: "Ya existe un empleado con ese nombre" },
        { status: 409 }
      );
    }

    console.error("Error al actualizar empleado:", error);
    return NextResponse.json(
      { error: "No se pudo actualizar el empleado" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { response } = await requireRole(["ADMIN", "SUPERVISOR"]);
  if (response) return response;

  try {
    const { id } = await params;

    const empleado = await prisma.empleado.update({
      where: { id },
      data: { activo: false },
    });

    return NextResponse.json(empleado, { status: 200 });
  } catch (error: unknown) {
    if (isPrismaError(error, "P2025")) {
      return NextResponse.json(
        { error: "Empleado no encontrado" },
        { status: 404 }
      );
    }

    console.error("Error al eliminar empleado:", error);
    return NextResponse.json(
      { error: "No se pudo eliminar el empleado" },
      { status: 500 }
    );
  }
}
