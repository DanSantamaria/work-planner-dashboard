// Turns the raw values stored in the history (enum codes, true/false, null)
// into the words the app uses everywhere else ("Incidencia", "Pendiente"...).
// Kept apart from the page so it stays a plain, easy-to-test function file.

const ETIQUETA_CAMPO: Record<string, string> = {
  // Evento
  tipo: "Tipo",
  origenVacacion: "Origen",
  justificada: "Justificada",
  tipoHoras: "Tipo de horas",
  horas: "Horas",
  notas: "Notas",
  // Remaining balances (what the employee has left)
  saldoVacaciones: "Vacaciones",
  saldoHorasExceso: "Horas de exceso",
  saldoHorasMedicas: "Horas médicas",
  // Totals edited by hand
  diasVacaciones: "Vacaciones totales (días)",
  horasExceso: "Horas de exceso totales",
  horasMedicasTotal: "Horas médicas totales",
};

const ETIQUETA_TIPO_EVENTO: Record<string, string> = {
  VACACION: "Vacaciones",
  AUSENCIA: "Ausencia",
  NOTA: "Incidencia",
};

const ETIQUETA_ORIGEN: Record<string, string> = {
  ANIO_ACTUAL: "Año actual",
  ANIO_ANTERIOR: "Año anterior",
};

const ETIQUETA_TIPO_HORAS: Record<string, string> = {
  MEDICA: "Médica",
  EXCESO: "Exceso",
};

export const ETIQUETA_ACCION: Record<string, string> = {
  CREAR: "Creado",
  EDITAR: "Editado",
  ELIMINAR: "Eliminado",
};

export function etiquetaTipoEvento(tipo: string | null | undefined): string {
  return tipo ? (ETIQUETA_TIPO_EVENTO[tipo] ?? tipo) : "—";
}

export function etiquetaCampo(campo: string): string {
  return ETIQUETA_CAMPO[campo] ?? campo;
}

export function etiquetaValor(
  campo: string,
  valor: string | number | boolean | null
): string {
  if (valor === null || valor === "") {
    // For "Justificada" a null is a real state, not an absence of data.
    return campo === "justificada" ? "Pendiente" : "—";
  }
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  if (typeof valor === "number") return String(valor);

  if (campo === "tipo") return etiquetaTipoEvento(valor);
  if (campo === "origenVacacion") return ETIQUETA_ORIGEN[valor] ?? valor;
  if (campo === "tipoHoras") return ETIQUETA_TIPO_HORAS[valor] ?? valor;
  return valor;
}

/** "13/11/2026" — event dates are stored at UTC midnight, so read them in UTC. */
export function formatearDiaUTC(fecha: Date): string {
  const d = String(fecha.getUTCDate()).padStart(2, "0");
  const m = String(fecha.getUTCMonth() + 1).padStart(2, "0");
  return `${d}/${m}/${fecha.getUTCFullYear()}`;
}

/** "13/11/2026" for one day, "03/11/2026 → 12/11/2026 (10 días)" for a range. */
export function formatearPeriodo(
  inicio: Date | null,
  fin: Date | null,
  dias: number | null
): string {
  if (!inicio) return "—";
  if (!fin || inicio.getTime() === fin.getTime()) return formatearDiaUTC(inicio);
  const cuantos = dias ? ` (${dias} días)` : "";
  return `${formatearDiaUTC(inicio)} → ${formatearDiaUTC(fin)}${cuantos}`;
}

/** The moment the change was made, in the team's time zone. */
export function formatearMomento(fecha: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(fecha);
}

/** The JSON columns come back from the database as `unknown`; this reads
    them defensively into a clean list of changes. */
export function comoCambios(
  valor: unknown
): { campo: string; anterior: string | number | boolean | null; nuevo: string | number | boolean | null }[] {
  if (!Array.isArray(valor)) return [];

  const cambios: {
    campo: string;
    anterior: string | number | boolean | null;
    nuevo: string | number | boolean | null;
  }[] = [];

  for (const item of valor) {
    if (typeof item !== "object" || item === null) continue;
    const { campo, anterior, nuevo } = item as Record<string, unknown>;
    if (typeof campo !== "string") continue;

    const limpio = (v: unknown) =>
      typeof v === "string" || typeof v === "number" || typeof v === "boolean"
        ? v
        : null;

    cambios.push({ campo, anterior: limpio(anterior), nuevo: limpio(nuevo) });
  }

  return cambios;
}

// The three remaining balances shown in the "Saldos" column, with the unit
// each one is measured in.
export const SALDOS_MOSTRADOS: { campo: string; unidad: "dias" | "horas" }[] = [
  { campo: "saldoVacaciones", unidad: "dias" },
  { campo: "saldoHorasExceso", unidad: "horas" },
  { campo: "saldoHorasMedicas", unidad: "horas" },
];

/** "10 días", "1 día", "1,5 h" */
export function formatearSaldo(
  valor: string | number | boolean | null,
  unidad: "dias" | "horas"
): string {
  if (typeof valor !== "number") return "—";
  const numero = new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: 2,
  }).format(valor);
  if (unidad === "horas") return `${numero} h`;
  return `${numero} ${valor === 1 ? "día" : "días"}`;
}
