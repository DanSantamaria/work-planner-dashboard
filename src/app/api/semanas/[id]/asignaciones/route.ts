import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPrismaError } from "@/lib/prisma-errors";
import { requireRole } from "@/lib/api-auth";

const ASIGNACION_INCLUDE = {
  empleado: { select: { id: true, nombre: true } },
  tarea: { select: { id: true, nombre: true } },
} as const;

const DIAS_VALIDOS = [1, 2, 3, 4, 5];

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  const { response } = await requireRole(["ADMIN", "SUPERVISOR"]);
  if (response) return response;

  try {
    const { id: semanaId } = await params;
    const body = await request.json();
    const { asignaciones } = body;

    if (!Array.isArray(asignaciones)) {
      return NextResponse.json(
        { error: "Se esperaba un array de asignaciones" },
        { status: 400 }
      );
    }

    for (const a of asignaciones) {
      if (
        typeof a?.empleadoId !== "string" ||
        typeof a?.tareaId !== "string" ||
        !DIAS_VALIDOS.includes(a?.diaSemana)
      ) {
        return NextResponse.json(
          { error: "Una o más asignaciones tienen datos inválidos" },
          { status: 400 }
        );
      }
    }

    await prisma.$transaction([
      prisma.asignacionSemanal.deleteMany({ where: { semanaId } }),
      prisma.asignacionSemanal.createMany({
        data: asignaciones.map((a) => ({
          empleadoId: a.empleadoId,
          tareaId: a.tareaId,
          diaSemana: a.diaSemana,
          semanaId,
        })),
      }),
    ]);

    const semanaActualizada = await prisma.semanaPlan.findUnique({
      where: { id: semanaId },
      include: { asignaciones: { include: ASIGNACION_INCLUDE } },
    });

    return NextResponse.json(semanaActualizada, { status: 200 });
  } catch (error: unknown) {
    if (isPrismaError(error, "P2003")) {
      return NextResponse.json(
        { error: "Uno o más empleados o tareas no existen" },
        { status: 400 }
      );
    }

    console.error("Error al guardar asignaciones:", error);
    return NextResponse.json(
      { error: "No se pudieron guardar las asignaciones" },
      { status: 500 }
    );
  }
}
