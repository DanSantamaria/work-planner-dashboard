// Human-readable date labels, shared by /calendario and /semana so both
// screens speak the same language: "21 Agosto, 2026" for a single day and
// "17-21 Agosto, 2026" for a range.
//
// The range helper takes two plain dates rather than "a week" on purpose:
// /calendario's weeks run Monday–Sunday (7 days) and /semana's run
// Monday–Friday (5), and neither has to know about the other.

export const NOMBRES_MES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

/** "21 Agosto, 2026" */
export function formatearDia(fecha: Date): string {
  return `${fecha.getDate()} ${NOMBRES_MES[fecha.getMonth()]}, ${fecha.getFullYear()}`;
}

/** "Agosto, 2026" */
export function formatearMes(fecha: Date): string {
  return `${NOMBRES_MES[fecha.getMonth()]}, ${fecha.getFullYear()}`;
}

/**
 * "17-21 Agosto, 2026", collapsing whatever the two ends have in common:
 * a range inside one month names it once, one crossing months names both
 * ("29 Agosto - 2 Septiembre, 2026"), and one crossing years spells the year
 * out on each side.
 */
export function formatearRango(inicio: Date, fin: Date): string {
  const mismoAnio = inicio.getFullYear() === fin.getFullYear();
  const mismoMes = mismoAnio && inicio.getMonth() === fin.getMonth();

  if (mismoMes) {
    return `${inicio.getDate()}-${fin.getDate()} ${NOMBRES_MES[inicio.getMonth()]}, ${inicio.getFullYear()}`;
  }

  if (mismoAnio) {
    return `${inicio.getDate()} ${NOMBRES_MES[inicio.getMonth()]} - ${fin.getDate()} ${NOMBRES_MES[fin.getMonth()]}, ${inicio.getFullYear()}`;
  }

  return `${formatearDia(inicio)} - ${formatearDia(fin)}`;
}
