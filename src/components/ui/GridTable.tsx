import { forwardRef, type ReactNode } from "react";

// Shared shell + header cells for the "employee rows x day columns"
// tables used by /semana and /calendario (Día/Semana/Mes). Row/cell
// content stays per-view since it renders completely different things
// (task assignments vs. calendar events) — only the wrapper and header
// styling repeat enough across views to share.

// forwardRef so SemanaGrid can attach its contenedorTablaRef directly to
// this wrapper div (TareaDropdown reads it for positioning) instead of
// needing its own redundant outer div just to hold the ref.
export const GridTable = forwardRef<
  HTMLDivElement,
  { children: ReactNode; textoClase?: string }
>(function GridTable({ children, textoClase = "text-sm" }, ref) {
  return (
    <div
      ref={ref}
      className="overflow-x-auto overflow-y-hidden rounded-2xl"
    >
      <table className={`w-full border-collapse ${textoClase}`}>
        {children}
      </table>
    </div>
  );
});

type NombreHeaderCellProps = {
  children: ReactNode;
  anchoClase?: string;
  stickyLeftClase?: string;
  paddingClase?: string;
  textoClase?: string;
};

// Also reused for Semana's extra sticky "Horario" column — same sticky/
// bg/text treatment, just a different width and left offset.
export function NombreHeaderCell({
  children,
  anchoClase = "w-48",
  stickyLeftClase = "left-0",
  paddingClase = "px-4 py-3",
  textoClase = "text-lg",
}: NombreHeaderCellProps) {
  return (
    <th
      className={`sticky ${stickyLeftClase} z-20 ${anchoClase} border border-gray-300 bg-table-header text-left text-gray-800 ${paddingClase} ${textoClase}`}
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
      className={`whitespace-nowrap border border-gray-300 bg-table-header text-center text-gray-800 ${anchoClase} ${paddingClase} ${
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
