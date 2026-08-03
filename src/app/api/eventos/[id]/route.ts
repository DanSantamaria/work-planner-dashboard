import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPrismaError } from "@/lib/prisma-errors";
import { requireRole } from "@/lib/api-auth";
import {
  balanceUpdateParaEvento,
  combinarBalanceUpdates,
} from "@/lib/evento-balance";
import { TipoEvento, OrigenVacacion, TipoHoras } from "@/generated/prisma/client";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// tipo, fecha, and empleadoId are intentionally not editable here — changing
// the kind of an event reopens which balance should be adjusted. Delete and
// recreate instead if that's what's needed.
export async function PATCH(request: Request, { params }: RouteContext) {
  const { response } = await requireRole(["ADMIN", "SUPERVISOR"]);
  if (response) return response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { notas, origenVacacion, justificada, tipoHoras, horas } = body;

    const existente = await prisma.evento.findUnique({ where: { id } });
    if (!existente) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      );
    }

    if (
      existente.tipo === TipoEvento.VACACION &&
      origenVacacion !== undefined &&
      !Object.values(OrigenVacacion).includes(origenVacacion)
    ) {
      return NextResponse.json(
        { error: "El origen de la vacación no es válido" },
        { status: 400 }
      );
    }

    let tipoHorasNuevo = existente.tipoHoras;
    let horasNuevo = existente.horas;

    if (existente.tipo === TipoEvento.NOTA) {
      if (tipoHoras !== undefined) {
        if (tipoHoras !== null && !Object.values(TipoHoras).includes(tipoHoras)) {
          return NextResponse.json(
            { error: "El tipo de horas no es válido" },
            { status: 400 }
          );
        }
        tipoHorasNuevo = tipoHoras;
      }

      if (horas !== undefined) {
        if (horas !== null && (typeof horas !== "number" || horas <= 0)) {
          return NextResponse.json(
            { error: "Las horas deben ser un número mayor que cero" },
            { status: 400 }
          );
        }
        horasNuevo = horas;
      }
    }

    const evento = await prisma.$transaction(async (tx) => {
      const actualizado = await tx.evento.update({
        where: { id },
        data: {
          ...(notas !== undefined && { notas: notas?.trim() || null }),
          ...(existente.tipo === TipoEvento.VACACION &&
            origenVacacion !== undefined && { origenVacacion }),
          ...(existente.tipo === TipoEvento.AUSENCIA &&
            justificada !== undefined && { justificada }),
          ...(existente.tipo === TipoEvento.NOTA && {
            tipoHoras: tipoHorasNuevo,
            horas: horasNuevo,
          }),
        },
      });

      const balanceUpdate = combinarBalanceUpdates(
        balanceUpdateParaEvento(
          existente.tipo,
          existente.tipoHoras,
          existente.horas,
          -1
        ),
        balanceUpdateParaEvento(existente.tipo, tipoHorasNuevo, horasNuevo, 1)
      );

      if (Object.keys(balanceUpdate).length > 0) {
        await tx.empleado.update({
          where: { id: existente.empleadoId },
          data: balanceUpdate,
        });
      }

      return actualizado;
    });

    return NextResponse.json(evento, { status: 200 });
  } catch (error: unknown) {
    if (isPrismaError(error, "P2025")) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      );
    }

    console.error("Error al actualizar evento:", error);
    return NextResponse.json(
      { error: "No se pudo actualizar el evento" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { response } = await requireRole(["ADMIN", "SUPERVISOR"]);
  if (response) return response;

  try {
    const { id } = await params;

    const existente = await prisma.evento.findUnique({ where: { id } });
    if (!existente) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.evento.delete({ where: { id } });

      const balanceUpdate = balanceUpdateParaEvento(
        existente.tipo,
        existente.tipoHoras,
        existente.horas,
        -1
      );

      if (Object.keys(balanceUpdate).length > 0) {
        await tx.empleado.update({
          where: { id: existente.empleadoId },
          data: balanceUpdate,
        });
      }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    if (isPrismaError(error, "P2025")) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      );
    }

    console.error("Error al eliminar evento:", error);
    return NextResponse.json(
      { error: "No se pudo eliminar el evento" },
      { status: 500 }
    );
  }
}
