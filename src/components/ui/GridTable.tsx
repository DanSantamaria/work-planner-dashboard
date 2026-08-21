import type { ReactNode } from "react";

// Shared shell + header cells for the "employee rows x day columns"
// tables used by /semana and /calendario (Día/Semana/Mes). Row/cell
// content stays per-view since it renders completely different things
// (task assignments vs. calendar events) — only the wrapper and header
// styling repeat enough across views to share.

// The wrapper is a scroll container on phones and not one from md up, and
// that split is the whole point.
//
// Sticky positions itself against the nearest scrolling ancestor. On desktop
// there is no overflow here, so scrolling belongs to <main> and the header
// rides up with the page and parks under the top bar; the price is that a
// month too wide for the screen drags the title and toolbar sideways with it.
// On a phone that price is unpayable — every table is wider than the screen —
// so below md the box scrolls sideways by itself and the header gives up
// sticking. The frozen name column keeps working in both: it sticks
// horizontally against whichever container is doing the scrolling.
export function GridTable({
  children,
  textoClase = "text-sm",
  layoutClase = "",
  anchoClase = "w-full",
}: {
  children: ReactNode;
  textoClase?: string;
  layoutClase?: string;
  /**
   * Defaults to filling its container. Views with many columns pass `w-auto`
   * so the columns keep the width they ask for instead of being squeezed to
   * fit — the table then grows past the screen and scrolls, which is the
   * point.
   */
  anchoClase?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl md:overflow-visible">
      <table
        className={`border-collapse ${anchoClase} ${textoClase} ${layoutClase}`}
      >
        {children}
      </table>
    </div>
  );
}

type NombreHeaderCellProps = {
  children: ReactNode;
  anchoClase?: string;
  stickyLeftClase?: string;
  paddingClase?: string;
  textoClase?: string;
  /** Frozen against horizontal scrolling. False for a second identity column
      that rides along with the days instead of holding the left edge. */
  fijo?: boolean;
};

// Also reused for Semana's "Horario" column, which shares the bg/text
// treatment but is not frozen (fijo={false}).
//
// When frozen it is sticky on both axes — the corner where the frozen column
// meets the frozen header — so it takes the highest z of the three: above the
// day headers (z-20) and above the body's frozen name cells (z-10).
export function NombreHeaderCell({
  children,
  anchoClase = "w-48",
  stickyLeftClase = "left-0",
  paddingClase = "px-4 py-3",
  textoClase = "text-lg",
  fijo = true,
}: NombreHeaderCellProps) {
  const posicionClase = fijo
    ? `sticky md:-top-0.5 ${stickyLeftClase} z-30`
    : "md:sticky md:-top-0.5 md:z-20";

  return (
    <th
      className={`${posicionClase} ${anchoClase} border border-gray-300 bg-table-header text-left text-gray-800 ${paddingClase} ${textoClase}`}
    >
      {children}
    </th>
  );
}

type DiaHeaderCellProps = {
  numero: number;
  nombreDia?: string;
  hoy?: boolean;
  anchoClase?: string;
  paddingClase?: string;
  numeroClase?: string;
};

// Without nombreDia, renders just the plain number (Mes's compact
// style). With it, renders the big-number-over-day-name layout (Semana/
// Día's fuller style).
export function DiaHeaderCell({
  numero,
  nombreDia,
  hoy = false,
  anchoClase = "",
  paddingClase = "px-4 py-3",
  numeroClase = "text-2xl",
}: DiaHeaderCellProps) {
  return (
    <th
      className={`md:sticky md:-top-0.5 md:z-20 whitespace-nowrap border border-gray-300 bg-table-header text-center text-gray-800 ${anchoClase} ${paddingClase} ${
        hoy ? "border-t-4 border-t-sidebar" : ""
      }`}
    >
      {nombreDia ? (
        <div className="flex flex-col items-center">
          <span className={`font-bold ${numeroClase}`}>{numero}</span>
          <span className="text-xs font-normal text-gray-600">
            {nombreDia}
          </span>
        </div>
      ) : (
        numero
      )}
    </th>
  );
}
