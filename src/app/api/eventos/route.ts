import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPrismaError } from "@/lib/prisma-errors";
import { requireRole } from "@/lib/api-auth";
import { balanceUpdateParaEvento } from "@/lib/evento-balance";
import {
  TipoEvento,
  OrigenVacacion,
  TipoHoras,
} from "@/generated/prisma/client";

export async function GET() {
  try {
    const eventos = await prisma.evento.findMany({
      orderBy: { fecha: "asc" },
    });

    return NextResponse.json(eventos, { status: 200 });
  } catch (error) {
    console.error("Error al obtener eventos:", error);
    return NextResponse.json(
      { error: "No se pudieron obtener los eventos" },
      { status: 500 }
    );
  }
}

// One day per calendar date between fechaInicio and fechaFin, inclusive.
function enumerarFechas(fechaInicio: Date, fechaFin: Date): Date[] {
  const fechas: Date[] = [];
  const actual = new Date(fechaInicio);

  while (actual <= fechaFin) {
    fechas.push(new Date(actual));
    actual.setUTCDate(actual.getUTCDate() + 1);
  }

  return fechas;
}

export async function POST(request: Request) {
  const { response } = await requireRole(["ADMIN", "SUPERVISOR"]);
  if (response) return response;

  try {
    const body = await request.json();
    const {
      empleadoId,
      tipo,
      fechaInicio,
      fechaFin,
      notas,
      origenVacacion,
      justificada,
      tipoHoras,
      horas,
    } = body;

    if (!empleadoId || typeof empleadoId !== "string") {
      return NextResponse.json(
        { error: "El empleado es obligatorio" },
        { status: 400 }
      );
    }

    if (!Object.values(TipoEvento).includes(tipo)) {
      return NextResponse.json(
        { error: "El tipo de evento no es válido" },
        { status: 400 }
      );
    }

    const inicioParsed = new Date(fechaInicio);
    const finParsed = new Date(fechaFin);
    if (
      !fechaInicio ||
      !fechaFin ||
      isNaN(inicioParsed.getTime()) ||
      isNaN(finParsed.getTime()) ||
      inicioParsed > finParsed
    ) {
      return NextResponse.json(
        { error: "El rango de fechas no es válido" },
        { status: 400 }
      );
    }

    if (
      tipo === TipoEvento.VACACION &&
      !Object.values(OrigenVacacion).includes(origenVacacion)
    ) {
      return NextResponse.json(
        { error: "Indica si la vacación es del año anterior o del actual" },
        { status: 400 }
      );
    }

    if (tipo === TipoEvento.NOTA && tipoHoras !== undefined && tipoHoras !== null) {
      if (!Object.values(TipoHoras).includes(tipoHoras)) {
        return NextResponse.json(
          { error: "El tipo de horas no es válido" },
          { status: 400 }
        );
      }

      if (typeof horas !== "number" || horas <= 0) {
        return NextResponse.json(
          { error: "Las horas deben ser un número mayor que cero" },
          { status: 400 }
        );
      }

      if (inicioParsed.getTime() !== finParsed.getTime()) {
        return NextResponse.json(
          {
            error:
              "Una nota con horas solo puede registrarse en un único día",
          },
          { status: 400 }
        );
      }
    }

    const fechas = enumerarFechas(inicioParsed, finParsed);
    const notasTrim = typeof notas === "string" ? notas.trim() || null : null;

    const eventos = await prisma.$transaction(async (tx) => {
      await tx.evento.createMany({
        data: fechas.map((fecha) => ({
          empleadoId,
          tipo,
          fecha,
          notas: notasTrim,
          origenVacacion: tipo === TipoEvento.VACACION ? origenVacacion : null,
          justificada:
            tipo === TipoEvento.AUSENCIA ? justificada ?? null : null,
          tipoHoras: tipo === TipoEvento.NOTA ? tipoHoras ?? null : null,
          horas: tipo === TipoEvento.NOTA ? horas ?? null : null,
        })),
      });

      const balanceUpdate = balanceUpdateParaEvento(
        tipo,
        tipoHoras,
        horas,
        fechas.length
      );

      if (Object.keys(balanceUpdate).length > 0) {
        await tx.empleado.update({
          where: { id: empleadoId },
          data: balanceUpdate,
        });
      }

      return tx.evento.findMany({
        where: { empleadoId, fecha: { in: fechas } },
        orderBy: { fecha: "asc" },
      });
    });

    return NextResponse.json(eventos, { status: 201 });
  } catch (error: unknown) {
    if (isPrismaError(error, "P2002")) {
      return NextResponse.json(
        {
          error:
            "Ese empleado ya tiene un evento registrado en una de esas fechas",
        },
        { status: 409 }
      );
    }

    console.error("Error al crear eventos:", error);
    return NextResponse.json(
      { error: "No se pudieron crear los eventos" },
      { status: 500 }
    );
  }
}
