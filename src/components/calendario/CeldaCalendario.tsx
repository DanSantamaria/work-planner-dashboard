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

const DOT_CLASSES: Record<VarianteEvento, string> = {
  vacacion: "bg-vacacion-text",
  vacacionAnterior: "bg-vacacion-anterior-text",
  ausente: "bg-ausente-text",
  nota: "bg-nota-text",
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

function Marca({ variant, compact }: { variant: VarianteEvento; compact: boolean }) {
  if (compact) {
    return <span className={`mx-auto block h-2 w-2 rounded-full ${DOT_CLASSES[variant]}`} />;
  }
  return <Badge variant={variant}>{ETIQUETAS[variant]}</Badge>;
}

type Props = {
  celda: CeldaInfo;
  onClick?: () => void;
  compact?: boolean;
};

// Deliberately doesn't paint the "cerrado" gray here — that lives on the
// <td> itself in WeekGrid/MonthGrid/DayView, so the color reads as one
// continuous block across the whole column instead of a smaller patch
// inside each cell. This component only renders the evento badge/dot, if
// there is one, on top of whatever background the cell already has.
export default function CeldaCalendario({ celda, onClick, compact = false }: Props) {
  let contenido = null;

  if (celda.evento) {
    const marca = <Marca variant={celda.evento.variant} compact={compact} />;

    if (!celda.evento.data.notas) {
      contenido = marca;
    } else {
      const conTooltip = (
        <Tooltip contenido={celda.evento.data.notas}>{marca}</Tooltip>
      );

      // Tooltip's root is inline-block, so it shrinks to fit the dot and
      // the dot's own mx-auto has no leftover space left to split — the
      // centering has to happen one level up, on a full-width block that
      // centers its inline content. Compact only: the badge variant is
      // meant to sit left-aligned, exactly as it does without a note.
      contenido = compact ? (
        <span className="block text-center">{conTooltip}</span>
      ) : (
        conTooltip
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
