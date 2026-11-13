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

// fecha and empleadoId are intentionally not editable here. tipo is: changing
// it works because the balance effect is computed per event — we reverse what
// the old version contributed and apply what the new version contributes, so
// e.g. VACACION → AUSENCIA gives the vacation day back to the employee.
//
// Every type-specific column (origenVacacion, justificada, tipoHoras, horas)
// is recomputed from the NEW tipo with the same rules POST uses, so an event
// never keeps leftovers from its previous kind (an AUSENCIA that still
// carries an origenVacacion, say).
export async function PATCH(request: Request, { params }: RouteContext) {
  const { response } = await requireRole(["ADMIN", "SUPERVISOR"]);
  if (response) return response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { tipo, notas, origenVacacion, justificada, tipoHoras, horas } = body;

    const existente = await prisma.evento.findUnique({ where: { id } });
    if (!existente) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      );
    }

    const tipoNuevo: TipoEvento = tipo !== undefined ? tipo : existente.tipo;
    if (!Object.values(TipoEvento).includes(tipoNuevo)) {
      return NextResponse.json(
        { error: "El tipo de evento no es válido" },
        { status: 400 }
      );
    }

    // VACACION only: which year's days. Falls back to what the event
    // already had, so editing just the notes of a vacation keeps its origin.
    let origenNuevo: OrigenVacacion | null = null;
    if (tipoNuevo === TipoEvento.VACACION) {
      const candidato =
        origenVacacion !== undefined ? origenVacacion : existente.origenVacacion;
      if (!Object.values(OrigenVacacion).includes(candidato)) {
        return NextResponse.json(
          { error: "Indica si la vacación es del año anterior o del actual" },
          { status: 400 }
        );
      }
      origenNuevo = candidato;
    }

    // AUSENCIA and NOTA share the triage status; VACACION never has one.
    let justificadaNueva: boolean | null = null;
    if (
      tipoNuevo === TipoEvento.AUSENCIA ||
      tipoNuevo === TipoEvento.NOTA
    ) {
      const candidata =
        justificada !== undefined ? justificada : existente.justificada;
      if (candidata !== null && typeof candidata !== "boolean") {
        return NextResponse.json(
          { error: "El estado de justificación no es válido" },
          { status: 400 }
        );
      }
      justificadaNueva = candidata;
    }

    // NOTA only: optional hours logged against a balance.
    let tipoHorasNuevo: TipoHoras | null = null;
    let horasNuevo: number | null = null;
    if (tipoNuevo === TipoEvento.NOTA) {
      tipoHorasNuevo = tipoHoras !== undefined ? tipoHoras : existente.tipoHoras;
      horasNuevo = horas !== undefined ? horas : existente.horas;

      if (
        tipoHorasNuevo !== null &&
        !Object.values(TipoHoras).includes(tipoHorasNuevo)
      ) {
        return NextResponse.json(
          { error: "El tipo de horas no es válido" },
          { status: 400 }
        );
      }

      if (
        horasNuevo !== null &&
        (typeof horasNuevo !== "number" || horasNuevo <= 0)
      ) {
        return NextResponse.json(
          { error: "Las horas deben ser un número mayor que cero" },
          { status: 400 }
        );
      }
    }

    const evento = await prisma.$transaction(async (tx) => {
      const actualizado = await tx.evento.update({
        where: { id },
        data: {
          tipo: tipoNuevo,
          ...(notas !== undefined && { notas: notas?.trim() || null }),
          origenVacacion: origenNuevo,
          justificada: justificadaNueva,
          tipoHoras: tipoHorasNuevo,
          horas: horasNuevo,
        },
      });

      const balanceUpdate = combinarBalanceUpdates(
        balanceUpdateParaEvento(
          existente.tipo,
          existente.tipoHoras,
          existente.horas,
          -1
        ),
        balanceUpdateParaEvento(tipoNuevo, tipoHorasNuevo, horasNuevo, 1)
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
