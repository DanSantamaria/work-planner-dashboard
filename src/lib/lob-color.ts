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
  // Shares España's red rather than getting its own token — no visual
  // distinction was asked for beyond reusing that color.
  if (lob === "FIN_DE_SEMANA") return "shadow-[inset_16px_0_0_0_var(--color-lob-espana)]";
  return "shadow-[inset_16px_0_0_0_var(--color-lob-coordinacion)]";
}

// FIN_DE_SEMANA is a valid Prisma enum identifier (no spaces allowed
// there), but reads as "FIN DE SEMANA" everywhere a person sees it —
// every other LOB value displays as its own raw enum value directly, so
// this only needs to cover the one case that doesn't already read fine.
export function getLobLabel(lob: string): string {
  if (lob === "FIN_DE_SEMANA") return "FIN DE SEMANA";
  return lob;
}
