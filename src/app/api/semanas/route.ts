import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isPrismaError } from "@/lib/prisma-errors";
import { requireRole } from "@/lib/api-auth";
import { getMonday, addDays } from "@/lib/date-utils";

const ASIGNACION_INCLUDE = {
  empleado: { select: { id: true, nombre: true } },
  tarea: { select: { id: true, nombre: true } },
} as const;

export async function GET() {
  const session = await auth();
  const role = session?.user?.role;
  const isPrivileged = role === "ADMIN" || role === "SUPERVISOR";

  try {
    const semanas = await prisma.semanaPlan.findMany({
      where: isPrivileged ? {} : { publicada: true },
      orderBy: { fechaInicio: "desc" },
      include: {
        asignaciones: { include: ASIGNACION_INCLUDE },
      },
    });

    return NextResponse.json(semanas, { status: 200 });
  } catch (error) {
    console.error("Error al obtener semanas:", error);
    return NextResponse.json(
      { error: "No se pudieron obtener las semanas" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { response } = await requireRole(["ADMIN", "SUPERVISOR"]);
  if (response) return response;

  try {
    const body = await request.json();
    const { fechaInicio: fechaInicioRaw, copiarDeSemanaId } = body;

    const parsedDate = new Date(fechaInicioRaw);
    if (!fechaInicioRaw || isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: "Fecha de inicio inválida" },
        { status: 400 }
      );
    }

    const fechaInicio = getMonday(parsedDate);
    const fechaFin = addDays(fechaInicio, 6);

    const nuevaSemana = await prisma.$transaction(async (tx) => {
      const semana = await tx.semanaPlan.create({
        data: { fechaInicio, fechaFin },
      });

      if (copiarDeSemanaId) {
        const asignacionesOrigen = await tx.asignacionSemanal.findMany({
          where: { semanaId: copiarDeSemanaId },
        });

        if (asignacionesOrigen.length > 0) {
          await tx.asignacionSemanal.createMany({
            data: asignacionesOrigen.map((a) => ({
              diaSemana: a.diaSemana,
              empleadoId: a.empleadoId,
              tareaId: a.tareaId,
              semanaId: semana.id,
            })),
          });
        }
      }

      return semana;
    });

    const semanaCompleta = await prisma.semanaPlan.findUnique({
      where: { id: nuevaSemana.id },
      include: { asignaciones: { include: ASIGNACION_INCLUDE } },
    });

    return NextResponse.json(semanaCompleta, { status: 201 });
  } catch (error: unknown) {
    if (isPrismaError(error, "P2002")) {
      return NextResponse.json(
        { error: "Ya existe una semana que empieza en esa fecha" },
        { status: 409 }
      );
    }

    console.error("Error al crear semana:", error);
    return NextResponse.json(
      { error: "No se pudo crear la semana" },
      { status: 500 }
    );
  }
}
