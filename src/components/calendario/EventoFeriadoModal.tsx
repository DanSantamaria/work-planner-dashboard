"use client";

import { useState } from "react";
import EventoModal, { type EventoCompleto } from "@/components/calendario/EventoModal";
import FeriadoForm, { type Feriado } from "@/components/calendario/FeriadoForm";

export type Tab = "EVENTO" | "FERIADO";

type Empleado = { id: string; nombre: string };

type Props = {
  onClose: () => void;
  tabInicial: Tab;
  empleados: Empleado[];
  eventoExistente?: EventoCompleto | null;
  prellenadoEvento?: { empleadoId: string; fecha: string } | null;
  feriadoExistente?: Feriado | null;
  prellenadoFeriado?: string | null;
  onGuardado: () => void;
};

const TABS: { valor: Tab; etiqueta: string }[] = [
  { valor: "EVENTO", etiqueta: "Evento" },
  { valor: "FERIADO", etiqueta: "Feriado" },
];

// Whoever renders this decides WHEN it exists (conditional rendering,
// e.g. {modalAbierto && <EventoFeriadoModal ... />}) instead of an open
// prop — that way a fresh instance mounts every time it opens, so
// EventoModal/FeriadoForm's internal state never goes stale between one
// day cell's click and the next.
export default function EventoFeriadoModal({
  onClose,
  tabInicial,
  empleados,
  eventoExistente,
  prellenadoEvento,
  feriadoExistente,
  prellenadoFeriado,
  onGuardado,
}: Props) {
  const [tab, setTab] = useState<Tab>(tabInicial);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex gap-4 border-b border-gray-200">
          {TABS.map((opcion) => (
            <button
              key={opcion.valor}
              type="button"
              onClick={() => setTab(opcion.valor)}
              className={`cursor-pointer border-b-2 px-1 pb-2 text-sm font-medium ${
                tab === opcion.valor
                  ? "border-accent text-accent"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {opcion.etiqueta}
            </button>
          ))}
        </div>

        {tab === "EVENTO" ? (
          <EventoModal
            empleados={empleados}
            eventoExistente={eventoExistente}
            prellenado={prellenadoEvento}
            onClose={onClose}
            onGuardado={onGuardado}
          />
        ) : (
          <FeriadoForm
            feriadoExistente={feriadoExistente}
            fechaPrellenada={prellenadoFeriado}
            onClose={onClose}
            onGuardado={onGuardado}
          />
        )}
      </div>
    </div>
  );
}
