import type { ReactNode } from "react";

// Shared shell + header cells for the "employee rows x day columns"
// tables used by /semana and /calendario (Día/Semana/Mes). Row/cell
// content stays per-view since it renders completely different things
// (task assignments vs. calendar events) — only the wrapper and header
// styling repeat enough across views to share.

// Deliberately NOT a scroll container. Sticky positions itself against the
// nearest scrolling ancestor, so any overflow here would capture the header
// row and the frozen name column, pinning them to a box that never moves —
// i.e. no sticking at all. Scrolling (both axes) belongs to <main> in the
// layout, which is what lets the header ride up with the page and stop under
// the top bar. The cost, accepted knowingly: a month too wide for the screen
// scrolls the page title and toolbar sideways along with it.
export function GridTable({
  children,
  textoClase = "text-sm",
  layoutClase = "",
}: {
  children: ReactNode;
  textoClase?: string;
  layoutClase?: string;
}) {
  return (
    <div className="rounded-2xl">
      <table className={`w-full border-collapse ${textoClase} ${layoutClase}`}>
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
};

// Also reused for Semana's extra sticky "Horario" column — same sticky/
// bg/text treatment, just a different width and left offset. Sticky on both
// axes (it is the corner where the frozen column meets the frozen header),
// hence the highest z of the three: above the day headers (z-20) and above
// the body's frozen name cells (z-10).
export function NombreHeaderCell({
  children,
  anchoClase = "w-48",
  stickyLeftClase = "left-0",
  paddingClase = "px-4 py-3",
  textoClase = "text-lg",
}: NombreHeaderCellProps) {
  return (
    <th
      className={`sticky -top-0.5 ${stickyLeftClase} z-30 ${anchoClase} border border-gray-300 bg-table-header text-left text-gray-800 ${paddingClase} ${textoClase}`}
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
      className={`sticky -top-0.5 z-20 whitespace-nowrap border border-gray-300 bg-table-header text-center text-gray-800 ${anchoClase} ${paddingClase} ${
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
