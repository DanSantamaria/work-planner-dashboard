"use client";

import Badge from "@/components/ui/Badge";
import Tooltip from "@/components/ui/Tooltip";
import type { CeldaInfo } from "@/lib/calendario-celda";

type VarianteColor = "feriado" | "vacacion" | "vacacionAnterior" | "ausente" | "nota";

const ETIQUETAS: Record<VarianteColor, string> = {
  feriado: "Feriado",
  vacacion: "Vacación",
  vacacionAnterior: "Vacación (año ant.)",
  ausente: "Ausencia",
  nota: "Nota",
};

const DOT_CLASSES: Record<VarianteColor, string> = {
  feriado: "bg-feriado-text",
  vacacion: "bg-vacacion-text",
  vacacionAnterior: "bg-vacacion-anterior-text",
  ausente: "bg-ausente-text",
  nota: "bg-nota-text",
};

function Marca({ variant, compact }: { variant: VarianteColor; compact: boolean }) {
  if (compact) {
    return <span className={`mx-auto block h-3 w-3 rounded-full ${DOT_CLASSES[variant]}`} />;
  }
  return <Badge variant={variant}>{ETIQUETAS[variant]}</Badge>;
}

function contenidoCelda(celda: CeldaInfo, compact: boolean) {
  if (celda.tipo === "feriado") {
    return (
      <Tooltip contenido={celda.etiqueta}>
        <Marca variant="feriado" compact={compact} />
      </Tooltip>
    );
  }

  if (celda.tipo === "finDeSemana") {
    return <Marca variant="feriado" compact={compact} />;
  }

  if (celda.tipo === "evento") {
    const marca = <Marca variant={celda.variant} compact={compact} />;
    if (celda.evento.notas) {
      return <Tooltip contenido={celda.evento.notas}>{marca}</Tooltip>;
    }
    return marca;
  }

  return null;
}

type Props = {
  celda: CeldaInfo;
  onClick?: () => void;
  compact?: boolean;
};

export default function CeldaCalendario({ celda, onClick, compact = false }: Props) {
  const contenido = contenidoCelda(celda, compact);

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
