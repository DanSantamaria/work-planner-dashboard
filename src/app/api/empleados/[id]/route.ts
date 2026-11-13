import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPrismaError } from "@/lib/prisma-errors";
import { LOB, Turno } from "@/generated/prisma/client";
import { requireRole } from "@/lib/api-auth";
import { diferencias, registrarHistorial, usuarioDe } from "@/lib/historial";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, { params }: RouteContext) {
  const { session, response } = await requireRole(["ADMIN", "SUPERVISOR"]);
  if (response) return response;

  try {
    const { id } = await params;
    const body = await request.json();
    const {
      nombre,
      lob,
      turno,
      horario,
      activo,
      diasVacaciones,
      horasExceso,
      horasMedicasTotal,
      grupoId,
      ordenEnGrupo,
    } = body;

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

    // Negatives are allowed here on purpose: these totals are edited via
    // the balance shown on /calendario, and a balance goes below zero as
    // soon as someone takes more days or hours than they were granted.
    // Only "is it a finite number" is enforced. (ordenEnGrupo below is a
    // position index, not a balance, so it stays non-negative.)
    for (const [campo, valor] of [
      ["diasVacaciones", diasVacaciones],
      ["horasExceso", horasExceso],
      ["horasMedicasTotal", horasMedicasTotal],
    ] as const) {
      if (valor !== undefined && !Number.isFinite(valor)) {
        return NextResponse.json(
          { error: `${campo} debe ser un número` },
          { status: 400 }
        );
      }
    }

    if (
      grupoId !== undefined &&
      grupoId !== null &&
      typeof grupoId !== "string"
    ) {
      return NextResponse.json({ error: "grupoId inválido" }, { status: 400 });
    }

    if (
      ordenEnGrupo !== undefined &&
      (typeof ordenEnGrupo !== "number" || ordenEnGrupo < 0)
    ) {
      return NextResponse.json(
        { error: "ordenEnGrupo debe ser un número mayor o igual a cero" },
        { status: 400 }
      );
    }

    const empleado = await prisma.$transaction(async (tx) => {
      // The yearly totals edited by hand on /calendario are tracked in the
      // history; read them first so we can say what they were before.
      const antes = await tx.empleado.findUniqueOrThrow({
        where: { id },
        select: {
          nombre: true,
          diasVacaciones: true,
          horasExceso: true,
          horasMedicasTotal: true,
        },
      });

      const actualizado = await tx.empleado.update({
        where: { id },
        data: {
          ...(nombre !== undefined && { nombre: nombre.trim() }),
          ...(lob !== undefined && { lob }),
          ...(turno !== undefined && { turno }),
          ...(horario !== undefined && {
            horario: typeof horario === "string" ? horario.trim() : "",
          }),
          ...(activo !== undefined && { activo }),
          ...(diasVacaciones !== undefined && { diasVacaciones }),
          ...(horasExceso !== undefined && { horasExceso }),
          ...(horasMedicasTotal !== undefined && { horasMedicasTotal }),
          ...(grupoId !== undefined && { grupoId }),
          ...(ordenEnGrupo !== undefined && { ordenEnGrupo }),
        },
      });

      await registrarHistorial(tx, {
        categoria: "SALDO",
        accion: "EDITAR",
        ...usuarioDe(session),
        empleadoId: id,
        empleadoNombre: actualizado.nombre,
        cambios: diferencias(
          {
            diasVacaciones: antes.diasVacaciones,
            horasExceso: antes.horasExceso,
            horasMedicasTotal: antes.horasMedicasTotal,
          },
          {
            diasVacaciones: actualizado.diasVacaciones,
            horasExceso: actualizado.horasExceso,
            horasMedicasTotal: actualizado.horasMedicasTotal,
          }
        ),
        saldos: [],
      });

      return actualizado;
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
