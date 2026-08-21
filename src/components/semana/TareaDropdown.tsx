"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useClickOutside } from "@/hooks/useClickOutside";

type Tarea = { id: string; nombre: string };

// The panel is rendered through a portal, straight into <body>, because its
// natural home — GridTable's wrapper — has overflow-x-auto, and a container
// that clips one axis clips the other too. Inside the table, a week filtered
// down to a single employee left the panel ~60px tall and beheaded. Out here
// its size is its own business, so these stay fixed no matter how many rows
// the table happens to be showing.
const ALTURA_PANEL = 320; // == h-80 below; keep both in sync
const ANCHO_PANEL = 256; // == w-64 below
const SEPARACION = 4; // gap between button and panel
const MARGEN_VENTANA = 8; // never let the panel touch the viewport edge

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
  if (nombre === "RECEPCION") {
    return `inline-block bg-recepcion-bg text-recepcion-text border border-recepcion-text rounded-md text-xs px-2 py-1${acento}`;
  }
  return `inline-block bg-gray-200 text-gray-700 rounded-md text-xs px-2 py-1${acento}`;
}

export default function TareaDropdown({
  tareasDisponibles,
  seleccionadas,
  onChange,
}: Props) {
  // Position doubles as the open flag: a portalled panel is positioned from
  // the button's on-screen rectangle, so there is no "open but unpositioned"
  // state worth representing.
  const [posicion, setPosicion] = useState<{ top: number; left: number } | null>(
    null
  );
  const abierto = posicion !== null;
  const contenedorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previaARef = useRef<string[]>([]);

  // The panel lives outside contenedorRef in the DOM, so it has to be named
  // explicitly here or every click on a checkbox would read as "outside".
  useClickOutside(contenedorRef, () => setPosicion(null), panelRef);

  // A fixed-position panel doesn't travel with the page: without this it
  // would hang in mid-air next to nothing as soon as anything scrolled.
  // Capture phase, because the scroll that matters is usually the table's or
  // <main>'s, and those don't bubble to window.
  useEffect(() => {
    if (!abierto) return;

    const cerrar = () => setPosicion(null);
    window.addEventListener("scroll", cerrar, true);
    window.addEventListener("resize", cerrar);

    return () => {
      window.removeEventListener("scroll", cerrar, true);
      window.removeEventListener("resize", cerrar);
    };
  }, [abierto]);

  function alternarAbierto() {
    if (abierto) {
      setPosicion(null);
      return;
    }

    const rect = contenedorRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Flip up only when the viewport has no room below *and* there is more
    // room above — measured against the window now, not against the table,
    // which was the other half of the original bug.
    const espacioAbajo = window.innerHeight - rect.bottom;
    const espacioArriba = rect.top;
    const haciaArriba =
      espacioAbajo < ALTURA_PANEL + MARGEN_VENTANA && espacioArriba > espacioAbajo;

    const top = haciaArriba
      ? Math.max(MARGEN_VENTANA, rect.top - ALTURA_PANEL - SEPARACION)
      : rect.bottom + SEPARACION;
    const left = Math.max(
      MARGEN_VENTANA,
      Math.min(rect.left, window.innerWidth - ANCHO_PANEL - MARGEN_VENTANA)
    );

    setPosicion({ top, left });
  }

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
        onClick={alternarAbierto}
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

      {posicion &&
        createPortal(
          <div
            ref={panelRef}
            // Inline style, not Tailwind classes: these two numbers are
            // measured at click time and can't be known ahead of build.
            style={{ top: posicion.top, left: posicion.left }}
            className="fixed z-50 h-80 w-64 overflow-y-auto rounded-lg border border-gray-300 bg-white p-2 shadow-lg"
          >
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
          </div>,
          document.body
        )}
    </div>
  );
}
