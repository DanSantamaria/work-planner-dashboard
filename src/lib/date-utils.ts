export function getMonday(date: Date): Date {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getDiasDelMes(fecha: Date): Date[] {
  const year = fecha.getFullYear();
  const month = fecha.getMonth();
  const ultimoDia = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: ultimoDia }, (_, i) => new Date(year, month, i + 1));
}

// A full 6-week (42-day) rectangular grid for a mini month-calendar picker —
// unlike getDiasDelMes, this pads with days from the previous/next month so
// every row is a complete Monday-Sunday week, matching this app's Monday-
// first convention everywhere else (getMonday, WeekGrid, SemanaGrid).
export function getGrillaMes(fecha: Date): Date[] {
  const primerDiaMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
  const inicio = getMonday(primerDiaMes);
  return Array.from({ length: 42 }, (_, i) => addDays(inicio, i));
}
