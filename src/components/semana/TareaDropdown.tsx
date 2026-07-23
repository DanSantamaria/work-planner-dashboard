"use client";

import { useState, useRef } from "react";
import { useClickOutside } from "@/hooks/useClickOutside";

type Tarea = { id: string; nombre: string };

type Props = {
  tareasDisponibles: Tarea[];
  seleccionadas: string[];
  onChange: (nuevasSeleccionadas: string[]) => void;
};

function getPillClasses(nombre: string): string {
  const esCambioDeTurno = nombre.toUpperCase().includes("CAMBIO TURNO");
  const acento = esCambioDeTurno ? " font-bold ring-1 ring-gray-400" : "";

  if (nombre === "OFICINA") {
    return `inline-block bg-oficina-bg text-oficina-text border border-oficina-text rounded-md text-xs px-2 py-1${acento}`;
  }
  if (nombre === "AUSENTE") {
    return `inline-block bg-ausente-bg text-ausente-text font-bold border border-ausente-text rounded-md text-xs px-2 py-1${acento}`;
  }
  return `inline-block bg-gray-200 text-gray-700 rounded-md text-xs px-2 py-1${acento}`;
}

export default function TareaDropdown({
  tareasDisponibles,
  seleccionadas,
  onChange,
}: Props) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const previaARef = useRef<string[]>([]);

  useClickOutside(contenedorRef, () => setAbierto(false));

  const ausenteId = tareasDisponibles.find((t) => t.nombre === "AUSENTE")?.id;
  const ausenteSeleccionada = ausenteId ? seleccionadas.includes(ausenteId) : false;

  function toggleTarea(tareaId: string) {
    const esAusente = tareaId === ausenteId;

    if (esAusente) {
      if (seleccionadas.includes(tareaId)) {
        // Unchecking AUSENTE: bring back whatever was selected right before
        // it took over, instead of leaving the cell empty.
        onChange(previaARef.current);
      } else {
        // Checking AUSENTE: remember the current selection first, so it can
        // be restored later, then clear everything down to just AUSENTE.
        previaARef.current = seleccionadas;
        onChange([tareaId]);
      }
      return;
    }

    if (ausenteSeleccionada) {
      // Picking anything else while AUSENTE was active drops AUSENTE and
      // keeps only the newly picked task.
      onChange([tareaId]);
      return;
    }

    if (seleccionadas.includes(tareaId)) {
      onChange(seleccionadas.filter((id) => id !== tareaId));
    } else {
      onChange([...seleccionadas, tareaId]);
    }
  }

  const tareasSeleccionadas = tareasDisponibles.filter((t) =>
    seleccionadas.includes(t.id)
  );

  return (
    <div ref={contenedorRef} className="relative min-h-[2rem]">
      <button
        type="button"
        onClick={() => setAbierto((prev) => !prev)}
        className="w-full text-left cursor-pointer"
      >
        {tareasSeleccionadas.length === 0 ? (
          <span className="text-gray-400 text-xs italic">+ Añadir tarea</span>
        ) : (
          <div className="flex max-w-[220px] flex-wrap gap-1">
            {tareasSeleccionadas.map((t) => (
              <span key={t.id} className={getPillClasses(t.nombre)}>
                {t.nombre}
              </span>
            ))}
          </div>
        )}
      </button>

      {abierto && (
        <div className="absolute z-30 mt-1 w-64 max-h-64 overflow-y-auto rounded-lg border border-gray-300 bg-white p-2 shadow-lg">
          {tareasDisponibles.map((tarea) => {
            const esAusente = tarea.id === ausenteId;
            const deshabilitada = ausenteSeleccionada && !esAusente;

            return (
              <label
                key={tarea.id}
                className={`flex items-center gap-2 px-2 py-1 text-sm rounded ${
                  deshabilitada
                    ? "cursor-not-allowed text-gray-300"
                    : "cursor-pointer text-gray-700 hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={seleccionadas.includes(tarea.id)}
                  disabled={deshabilitada}
                  onChange={() => toggleTarea(tarea.id)}
                  className="accent-sidebar"
                />
                {tarea.nombre}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
