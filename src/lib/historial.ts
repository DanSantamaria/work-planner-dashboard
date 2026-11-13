import type { prisma } from "@/lib/prisma";
import type { TipoEvento } from "@/generated/prisma/client";

// How long a history row is kept. Anything older is deleted automatically the
// next time somebody writes a new row (see registrarHistorial), and is also
// hidden from the /historial page even if it hasn't been purged yet.
export const DIAS_RETENCION = 90;

const MS_POR_DIA = 24 * 60 * 60 * 1000;

export function fechaLimiteRetencion(ahora: Date = new Date()): Date {
  return new Date(ahora.getTime() - DIAS_RETENCION * MS_POR_DIA);
}

// A value that can be stored inside the JSON columns. Declared as a `type`
// (not an interface) so it is accepted as JSON by Prisma's types.
export type Valor = string | number | boolean | null;
export type Cambio = { campo: string; anterior: Valor; nuevo: Valor };

// The three "used" counters on Empleado that events move around.
export const SALDOS_USADOS_SELECT = {
  diasVacacionesUsados: true,
  horasExcesoUsadas: true,
  horasMedicasUsadas: true,
} as const;

export type SaldosUsados = {
  diasVacacionesUsados: number;
  horasExcesoUsadas: number;
  horasMedicasUsadas: number;
};

const CAMPOS_SALDOS_USADOS: (keyof SaldosUsados)[] = [
  "diasVacacionesUsados",
  "horasExcesoUsadas",
  "horasMedicasUsadas",
];

// Compares two flat objects field by field and returns only what differs.
//   antes = null  → the thing was just created (everything is "new")
//   despues = null → the thing was deleted (everything is "old")
// Fields that are null on the side that exists are left out, so creating a
// vacation doesn't list "Justificada: — → —".
export function diferencias(
  antes: Record<string, Valor> | null,
  despues: Record<string, Valor> | null
): Cambio[] {
  const campos = Array.from(
    new Set([...Object.keys(antes ?? {}), ...Object.keys(despues ?? {})])
  );
  const cambios: Cambio[] = [];

  for (const campo of campos) {
    const anterior = antes ? (antes[campo] ?? null) : null;
    const nuevo = despues ? (despues[campo] ?? null) : null;

    if (anterior === nuevo) continue;
    cambios.push({ campo, anterior, nuevo });
  }

  return cambios;
}

// The employee's "used" balances, before vs after. Only the ones that moved.
export function cambiosDeSaldos(
  antes: SaldosUsados,
  despues: SaldosUsados
): Cambio[] {
  return diferencias(
    Object.fromEntries(CAMPOS_SALDOS_USADOS.map((c) => [c, antes[c]])),
    Object.fromEntries(CAMPOS_SALDOS_USADOS.map((c) => [c, despues[c]]))
  );
}

type EventoSnapshotFuente = {
  tipo: TipoEvento;
  origenVacacion: string | null;
  justificada: boolean | null;
  tipoHoras: string | null;
  horas: number | null;
  notas: string | null;
};

// The fields of an Evento that are worth showing in the history.
export function snapshotEvento(e: EventoSnapshotFuente): Record<string, Valor> {
  return {
    tipo: e.tipo,
    origenVacacion: e.origenVacacion,
    justificada: e.justificada,
    tipoHoras: e.tipoHoras,
    horas: e.horas,
    notas: e.notas,
  };
}

/** "2026-11-13" — the calendar day, as the database stores event dates. */
export function aISODia(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

// Who did it, taken from the session NextAuth gives the API routes.
export function usuarioDe(
  session: { user?: { id?: string | null; name?: string | null } } | null
) {
  return {
    usuarioId: session?.user?.id ?? "",
    usuarioNombre: session?.user?.name ?? "Usuario desconocido",
  };
}

export type DatosHistorial = {
  categoria: "EVENTO" | "SALDO";
  accion: "CREAR" | "EDITAR" | "ELIMINAR";
  usuarioId: string;
  usuarioNombre: string;
  empleadoId: string;
  empleadoNombre: string;
  fechaInicio?: Date;
  fechaFin?: Date;
  tipoEvento?: TipoEvento;
  dias?: number;
  cambios: Cambio[];
  saldos: Cambio[];
};

// Writes one history row. It takes the transaction client (`tx`) on purpose:
// the row is saved in the SAME transaction as the change it describes, so
// they either both happen or neither does — there can never be a change
// without its record, or a record of a change that was rolled back.
//
// It also deletes rows past the retention window. Doing the cleanup on write
// means no scheduled job is needed: any activity keeps the table trimmed.
// (createdAt is indexed, so the delete is cheap.)
export async function registrarHistorial(
  tx: Pick<typeof prisma, "historialCalendario">,
  datos: DatosHistorial
) {
  // Saving an edit that changed nothing is not worth a row.
  if (
    datos.accion === "EDITAR" &&
    datos.cambios.length === 0 &&
    datos.saldos.length === 0
  ) {
    return;
  }

  await tx.historialCalendario.create({
    data: {
      categoria: datos.categoria,
      accion: datos.accion,
      usuarioId: datos.usuarioId,
      usuarioNombre: datos.usuarioNombre,
      empleadoId: datos.empleadoId,
      empleadoNombre: datos.empleadoNombre,
      fechaInicio: datos.fechaInicio,
      fechaFin: datos.fechaFin,
      tipoEvento: datos.tipoEvento,
      dias: datos.dias,
      cambios: datos.cambios,
      // undefined (not null) = "leave the column empty"; Prisma doesn't
      // accept a plain null for an optional JSON column.
      saldos: datos.saldos.length > 0 ? datos.saldos : undefined,
    },
  });

  await tx.historialCalendario.deleteMany({
    where: { createdAt: { lt: fechaLimiteRetencion() } },
  });
}
