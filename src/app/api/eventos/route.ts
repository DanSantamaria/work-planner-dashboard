import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isPrismaError } from "@/lib/prisma-errors";
import { requireRole } from "@/lib/api-auth";
import { balanceUpdateParaEvento } from "@/lib/evento-balance";
import {
  SALDOS_USADOS_SELECT,
  cambiosDeSaldos,
  diferencias,
  registrarHistorial,
  snapshotEvento,
  usuarioDe,
  type SaldosUsados,
} from "@/lib/historial";
import {
  TipoEvento,
  OrigenVacacion,
  TipoHoras,
} from "@/generated/prisma/client";

export async function GET(request: Request) {
  try {
    const session = await auth();
    const esStaff =
      session?.user?.role === "ADMIN" || session?.user?.role === "SUPERVISOR";

    const { searchParams } = new URL(request.url);
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");

    const eventos = await prisma.evento.findMany({
      where:
        desde && hasta
          ? { fecha: { gte: new Date(desde), lte: new Date(hasta) } }
          : undefined,
      orderBy: { fecha: "asc" },
    });

    if (esStaff) {
      return NextResponse.json(eventos, { status: 200 });
    }

    // Non-staff callers only get what's needed to color a calendar cell —
    // never notas, justificada, or the medical/exceso hour detail.
    //
    // NOTA (shown as "Incidencia") is dropped outright rather than
    // stripped down: an incidencia is supervisor-only follow-up, so the
    // public view must not even learn one exists on that day. Filtering
    // here — not in the component — is what makes it absent from the
    // response payload, not merely absent from the rendered DOM.
    const eventosPublicos = eventos
      .filter((evento) => evento.tipo !== TipoEvento.NOTA)
      .map(({ id, fecha, tipo, origenVacacion, empleadoId }) => ({
        id,
        fecha,
        tipo,
        origenVacacion,
        empleadoId,
      }));

    return NextResponse.json(eventosPublicos, { status: 200 });
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
  const { session, response } = await requireRole(["ADMIN", "SUPERVISOR"]);
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
      // Read before changing anything: the history row needs the employee's
      // name and what their balances were beforehand.
      const empleado = await tx.empleado.findUniqueOrThrow({
        where: { id: empleadoId },
        select: { nombre: true, ...SALDOS_USADOS_SELECT },
      });

      await tx.evento.createMany({
        data: fechas.map((fecha) => ({
          empleadoId,
          tipo,
          fecha,
          notas: notasTrim,
          origenVacacion: tipo === TipoEvento.VACACION ? origenVacacion : null,
          // AUSENCIA and NOTA both carry a triage status; VACACION never
          // does, so it is forced back to null rather than trusted from
          // the body.
          justificada:
            tipo === TipoEvento.AUSENCIA || tipo === TipoEvento.NOTA
              ? justificada ?? null
              : null,
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

      let saldosDespues: SaldosUsados = empleado;
      if (Object.keys(balanceUpdate).length > 0) {
        saldosDespues = await tx.empleado.update({
          where: { id: empleadoId },
          data: balanceUpdate,
          select: SALDOS_USADOS_SELECT,
        });
      }

      // One row for the whole range, however many days it covers.
      await registrarHistorial(tx, {
        categoria: "EVENTO",
        accion: "CREAR",
        ...usuarioDe(session),
        empleadoId,
        empleadoNombre: empleado.nombre,
        fechaInicio: inicioParsed,
        fechaFin: finParsed,
        tipoEvento: tipo,
        dias: fechas.length,
        cambios: diferencias(
          null,
          snapshotEvento({
            tipo,
            origenVacacion: tipo === TipoEvento.VACACION ? origenVacacion : null,
            justificada:
              tipo === TipoEvento.AUSENCIA || tipo === TipoEvento.NOTA
                ? justificada ?? null
                : null,
            tipoHoras: tipo === TipoEvento.NOTA ? tipoHoras ?? null : null,
            horas: tipo === TipoEvento.NOTA ? horas ?? null : null,
            notas: notasTrim,
          })
        ),
        saldos: cambiosDeSaldos(empleado, saldosDespues),
      });

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

    if (isPrismaError(error, "P2025")) {
      return NextResponse.json(
        { error: "Empleado no encontrado" },
        { status: 404 }
      );
    }

    console.error("Error al crear eventos:", error);
    return NextResponse.json(
      { error: "No se pudieron crear los eventos" },
      { status: 500 }
    );
  }
}
