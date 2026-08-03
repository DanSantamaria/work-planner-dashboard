import type { TipoEvento, TipoHoras } from "@/generated/prisma/client";

type BalanceUpdate = {
  diasVacacionesUsados?: { increment: number };
  horasMedicasUsadas?: { increment: number };
  horasExcesoUsadas?: { increment: number };
};

/**
 * Which Empleado balance field a given Evento affects, scaled by
 * `multiplicador` (positive to apply the effect, negative to reverse it,
 * >1 for a multi-day VACACION range). Returns {} when the event doesn't
 * touch any balance (AUSENCIA, or a NOTA with no hours logged).
 */
export function balanceUpdateParaEvento(
  tipo: TipoEvento,
  tipoHoras: TipoHoras | null | undefined,
  horas: number | null | undefined,
  multiplicador: number
): BalanceUpdate {
  if (tipo === "VACACION") {
    return { diasVacacionesUsados: { increment: multiplicador } };
  }

  if (tipo === "NOTA" && tipoHoras && horas) {
    const campo: keyof BalanceUpdate =
      tipoHoras === "MEDICA" ? "horasMedicasUsadas" : "horasExcesoUsadas";
    return { [campo]: { increment: horas * multiplicador } };
  }

  return {};
}

/** Sums increments for the same field across multiple balance updates. */
export function combinarBalanceUpdates(
  ...updates: BalanceUpdate[]
): BalanceUpdate {
  const resultado: BalanceUpdate = {};

  for (const update of updates) {
    for (const [campo, valor] of Object.entries(update) as [
      keyof BalanceUpdate,
      { increment: number },
    ][]) {
      resultado[campo] = {
        increment: (resultado[campo]?.increment ?? 0) + valor.increment,
      };
    }
  }

  return resultado;
}
