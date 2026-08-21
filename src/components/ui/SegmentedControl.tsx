"use client";

import type { ReactNode } from "react";

// One dark pill holding N mutually exclusive options, the active one filled
// with the accent color. Used for the calendar's Día/Semana/Mes switch and
// /semana's Día/Semana one — hence the generic option list rather than a
// hard-coded set.
//
// Not built on <Button>: its `ghost` variant carries no shape or padding at
// all and `primary` rounds to rounded-lg, so both would need enough overrides
// to end up less readable than the plain buttons below.

type Opcion<T extends string> = {
  valor: T;
  etiqueta: ReactNode;
};

type Props<T extends string> = {
  opciones: Opcion<T>[];
  valor: T;
  onChange: (valor: T) => void;
  /** Accessible name for the group, e.g. "Vista del calendario". */
  etiquetaGrupo?: string;
};

// Generic over T so the callback hands back the caller's own union type
// (Modo, VistaSemana…) instead of a plain string, and passing an option that
// isn't part of that union fails to compile.
export default function SegmentedControl<T extends string>({
  opciones,
  valor,
  onChange,
  etiquetaGrupo,
}: Props<T>) {
  return (
    <div
      role="group"
      aria-label={etiquetaGrupo}
      className="inline-flex rounded-full bg-sidebar"
    >
      {opciones.map((opcion) => {
        const activa = opcion.valor === valor;

        return (
          <button
            key={opcion.valor}
            type="button"
            onClick={() => onChange(opcion.valor)}
            aria-pressed={activa}
            className={`cursor-pointer rounded-full px-5 py-2 text-sm font-medium transition-colors ${
              activa ? "bg-accent text-white" : "text-white hover:opacity-70"
            }`}
          >
            {opcion.etiqueta}
          </button>
        );
      })}
    </div>
  );
}
