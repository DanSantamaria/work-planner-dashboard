"use client";

import Badge from "@/components/ui/Badge";
import Tooltip from "@/components/ui/Tooltip";
import type { CeldaInfo, VarianteEvento } from "@/lib/calendario-celda";

export const ETIQUETAS: Record<VarianteEvento, string> = {
  vacacion: "Vacaciones",
  vacacionAnterior: "Vacaciones (año ant.)",
  ausente: "Ausencia",
  nota: "Incidencia",
};

// The month-view square is a Badge with the label taken away, so it is
// built the same way one is: light -bg fill, darker -text as the outline.
// Deliberately the same token pairs Badge itself uses, so recolouring a
// state in globals.css moves the badge and the square together.
const MARCA_CUADRO_CLASSES: Record<VarianteEvento, string> = {
  vacacion: "bg-vacacion-bg border-vacacion-text",
  vacacionAnterior: "bg-vacacion-anterior-bg border-vacacion-anterior-text",
  ausente: "bg-ausente-bg border-ausente-text",
  nota: "bg-nota-bg border-nota-text",
};

// Used by DayView to tint its own <td> when an employee has a personal
// event that day — same convention as celda.cerrado's gray, which also
// lives on the <td>, not in here. Week/Month never read this.
export const CELDA_BG_CLASSES: Record<VarianteEvento, string> = {
  vacacion: "bg-vacacion-bg",
  vacacionAnterior: "bg-vacacion-anterior-bg",
  ausente: "bg-ausente-bg",
  nota: "bg-nota-bg",
};

// Which evento variants a given audience is allowed to see at all.
// "nota" is shown as "Incidencia" and is supervisor-only follow-up, so it
// is staff-only everywhere it appears. /api/eventos already drops NOTA
// rows for non-staff callers; this is the second lock on the same door,
// for any caller holding evento data that didn't come from that endpoint.
export function puedeVerVariante(
  variant: VarianteEvento,
  isStaff: boolean
): boolean {
  return isStaff || variant !== "nota";
}

// Month view's mark: a rounded square inset 4px from all four edges of
// the <td>, which carries `relative` so this anchors to the cell rather
// than to anything nested inside it.
//
// Absolute rather than a sized block on purpose. A table cell's height is
// resolved by the row, not declared on the cell, so `h-full` on a child
// has no length to resolve against and collapses. `inset-1` sidesteps
// that: the square is defined by its distance from each edge, so it
// tracks whatever size the cell ends up at — wider columns, a resized
// window, a taller row — with no breakpoints and no chance of overflow.
const CUADRO_POSICION = "absolute inset-1";

type Props = {
  celda: CeldaInfo;
  // Required, not defaulted: every call site already has this flag in
  // scope, and making TypeScript demand it means a new grid can't quietly
  // leak incidencias to the public view by forgetting to pass it.
  isStaff: boolean;
  onClick?: () => void;
  compact?: boolean;
};

// Deliberately doesn't paint the "cerrado" gray here — that lives on the
// <td> itself in WeekGrid/MonthGrid/DayView, so the color reads as one
// continuous block across the whole column instead of a smaller patch
// inside each cell. This component only renders the evento mark — a badge
// in week/day view, a square in month view — if there is one and the
// viewer may see it, on top of whatever background the cell already has.
export default function CeldaCalendario({
  celda,
  isStaff,
  onClick,
  compact = false,
}: Props) {
  let contenido = null;

  // Note this filters before anything is built, so a hidden variant
  // produces no element in the DOM at all — it is not rendered and then
  // hidden with CSS, which would still leave it readable in the markup.
  const evento =
    celda.evento && puedeVerVariante(celda.evento.variant, isStaff)
      ? celda.evento
      : null;

  if (evento) {
    const notas = evento.data.notas;

    if (compact) {
      // rounded-md and the 1px border match Badge exactly — only the
      // label and its padding are dropped.
      const cuadro = `rounded-md border ${MARCA_CUADRO_CLASSES[evento.variant]}`;

      // With a note, the Tooltip root has to BE the square rather than
      // wrap it: the square is absolutely positioned, so a shrink-to-fit
      // wrapper around it would have zero size and no hover area. The
      // inner span then fills that root, which does have a definite size.
      contenido = notas ? (
        <Tooltip contenido={notas} claseRaiz={CUADRO_POSICION}>
          <span className={`block h-full w-full ${cuadro}`} />
        </Tooltip>
      ) : (
        <span className={`${CUADRO_POSICION} ${cuadro}`} />
      );
    } else {
      const badge = <Badge variant={evento.variant}>{ETIQUETAS[evento.variant]}</Badge>;
      contenido = notas ? (
        <Tooltip contenido={notas}>{badge}</Tooltip>
      ) : (
        badge
      );
    }
  }

  if (!onClick) {
    return <div className="min-h-[1.75rem]">{contenido}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-[1.75rem] w-full cursor-pointer text-left"
    >
      {contenido}
    </button>
  );
}
