// Parses the real start time out of a free-text horario string like
// "07:00 - 15:00", instead of relying on the coarser turno category —
// matches the precedent in SemanaView.tsx's ordenarEmpleados exactly.
function obtenerMinutosInicio(horario: string): number {
  const match = horario.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return Infinity;

  const horas = Number(match[1]);
  const minutos = Number(match[2]);
  const totalMinutos = horas * 60 + minutos;

  // 00:00 is the NOCTURNO shift's start — it should sort last, not first
  // like a literal 0 would suggest.
  return totalMinutos === 0 ? 24 * 60 : totalMinutos;
}

export type EmpleadoOrdenableFlat = {
  nombre: string;
  lob: string;
  horario: string;
};

export type EmpleadoOrdenable = EmpleadoOrdenableFlat & {
  grupoId: string | null;
  ordenEnGrupo: number;
  grupo?: { orden: number; nombre: string } | null;
};

/**
 * The shared ordering rule for views that don't care about manual Grupo
 * assignment (/empleados, /semana, /calendario's Día/Semana/Mes grids):
 * Paloma first, Coordinación next, then shift start time, then LOB
 * alphabetically, then employee name alphabetically as the final,
 * fully-deterministic tiebreak.
 */
export function compararEmpleadosFlat(
  a: EmpleadoOrdenableFlat,
  b: EmpleadoOrdenableFlat
): number {
  const aEsPaloma = a.nombre === "Paloma Sánchez";
  const bEsPaloma = b.nombre === "Paloma Sánchez";
  if (aEsPaloma && !bEsPaloma) return -1;
  if (bEsPaloma && !aEsPaloma) return 1;

  const aEsCoordinacion = a.lob === "COORDINACION";
  const bEsCoordinacion = b.lob === "COORDINACION";
  if (aEsCoordinacion && !bEsCoordinacion) return -1;
  if (bEsCoordinacion && !aEsCoordinacion) return 1;

  const diferenciaHorario =
    obtenerMinutosInicio(a.horario) - obtenerMinutosInicio(b.horario);
  if (diferenciaHorario !== 0) return diferenciaHorario;

  const diferenciaLob = a.lob.localeCompare(b.lob);
  if (diferenciaLob !== 0) return diferenciaLob;

  return a.nombre.localeCompare(b.nombre);
}

/**
 * Sort priority for the "Grupos y Totales" balance table: Grupo.orden
 * (ungrouped last), then the manually-assigned ordenEnGrupo, falling
 * back to compararEmpleadosFlat only to break a tie within the same
 * group/position (shouldn't happen once ordenEnGrupo values are unique,
 * but keeps the order fully deterministic either way).
 */
export function compararEmpleados(
  a: EmpleadoOrdenable,
  b: EmpleadoOrdenable
): number {
  const ordenGrupoA = a.grupo?.orden ?? Number.MAX_SAFE_INTEGER;
  const ordenGrupoB = b.grupo?.orden ?? Number.MAX_SAFE_INTEGER;
  if (ordenGrupoA !== ordenGrupoB) return ordenGrupoA - ordenGrupoB;

  if (a.ordenEnGrupo !== b.ordenEnGrupo) return a.ordenEnGrupo - b.ordenEnGrupo;

  return compararEmpleadosFlat(a, b);
}

export function ordenarEmpleadosFlat<T extends EmpleadoOrdenableFlat>(
  empleados: T[]
): T[] {
  return [...empleados].sort(compararEmpleadosFlat);
}

export function ordenarEmpleados<T extends EmpleadoOrdenable>(
  empleados: T[]
): T[] {
  return [...empleados].sort(compararEmpleados);
}

export type GrupoConEmpleados<T> = {
  grupoId: string | null;
  nombreGrupo: string;
  empleados: T[];
};

/**
 * Buckets an already-sorted list into consecutive groups. Relies on
 * ordenarEmpleados having run first, since it groups purely by "did the
 * grupoId change from the previous row" — not by re-scanning the whole
 * list per group.
 */
export function agruparPorGrupo<T extends EmpleadoOrdenable>(
  empleadosOrdenados: T[]
): GrupoConEmpleados<T>[] {
  const grupos: GrupoConEmpleados<T>[] = [];

  for (const empleado of empleadosOrdenados) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.grupoId === empleado.grupoId) {
      ultimo.empleados.push(empleado);
    } else {
      grupos.push({
        grupoId: empleado.grupoId,
        nombreGrupo: empleado.grupo?.nombre ?? "Sin grupo",
        empleados: [empleado],
      });
    }
  }

  return grupos;
}
