// An inset box-shadow instead of border-l — border-collapse centers a
// cell's outer border on the grid line, so half of a 16px border-left on
// the table's leftmost column bleeds outside the table entirely. An
// inset shadow always paints fully inside the cell's own box.
// 16px = double the 8px accent width used for AUSENTE/OFICINA in
// SemanaGrid.tsx's getCeldaAccentClass.
export function getLobBorderClass(lob: string): string {
  if (lob === "ESPAÑA") return "shadow-[inset_16px_0_0_0_var(--color-lob-espana)]";
  if (lob === "FRANCIA") return "shadow-[inset_16px_0_0_0_var(--color-lob-francia)]";
  if (lob === "IRLANDA") return "shadow-[inset_16px_0_0_0_var(--color-lob-irlanda)]";
  return "shadow-[inset_16px_0_0_0_var(--color-lob-coordinacion)]";
}
