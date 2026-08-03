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
