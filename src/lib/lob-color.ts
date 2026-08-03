export function getLobColorClass(lob: string): string {
  if (lob === "ESPAÑA") return "bg-lob-espana";
  if (lob === "FRANCIA") return "bg-lob-francia";
  if (lob === "IRLANDA") return "bg-lob-irlanda";
  return "bg-lob-coordinacion";
}
