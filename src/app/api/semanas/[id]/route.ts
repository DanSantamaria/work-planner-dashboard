import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isPrismaError } from "@/lib/prisma-errors";
import { requireRole } from "@/lib/api-auth";

const ASIGNACION_INCLUDE = {
  empleado: { select: { id: true, nombre: true } },
  tarea: { select: { id: true, nombre: true } },
} as const;

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    const semana = await prisma.semanaPlan.findUnique({
      where: { id },
      include: { asignaciones: { include: ASIGNACION_INCLUDE } },
    });

    if (!semana) {
      return NextResponse.json(
        { error: "Semana no encontrada" },
        { status: 404 }
      );
    }

    if (!semana.publicada) {
      const session = await auth();
      const role = session?.user?.role;
      const isPrivileged = role === "ADMIN" || role === "SUPERVISOR";

      if (!isPrivileged) {
        return NextResponse.json(
          { error: "Semana no encontrada" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(semana, { status: 200 });
  } catch (error) {
    console.error("Error al obtener semana:", error);
    return NextResponse.json(
      { error: "No se pudo obtener la semana" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { response } = await requireRole(["ADMIN", "SUPERVISOR"]);
  if (response) return response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { publicada } = body;

    if (typeof publicada !== "boolean") {
      return NextResponse.json(
        { error: "El campo 'publicada' debe ser true o false" },
        { status: 400 }
      );
    }

    const semana = await prisma.semanaPlan.update({
      where: { id },
      data: { publicada },
      include: { asignaciones: { include: ASIGNACION_INCLUDE } },
    });

    return NextResponse.json(semana, { status: 200 });
  } catch (error: unknown) {
    if (isPrismaError(error, "P2025")) {
      return NextResponse.json(
        { error: "Semana no encontrada" },
        { status: 404 }
      );
    }

    console.error("Error al actualizar semana:", error);
    return NextResponse.json(
      { error: "No se pudo actualizar la semana" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { response } = await requireRole(["ADMIN"]);
  if (response) return response;

  try {
    const { id } = await params;

    await prisma.semanaPlan.delete({ where: { id } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    if (isPrismaError(error, "P2025")) {
      return NextResponse.json(
        { error: "Semana no encontrada" },
        { status: 404 }
      );
    }

    console.error("Error al eliminar semana:", error);
    return NextResponse.json(
      { error: "No se pudo eliminar la semana" },
      { status: 500 }
    );
  }
}
