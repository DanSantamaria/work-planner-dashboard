"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";
import { useClickOutside } from "@/hooks/useClickOutside";

type Tarea = { id: string; nombre: string };

// The panel is rendered through a portal, straight into <body>, because its
// natural home — GridTable's wrapper — has overflow-x-auto, and a container
// that clips one axis clips the other too. Inside the table, a week filtered
// down to a single employee left the panel ~60px tall and beheaded. Out here
// its size is its own business: it asks for the same height no matter how many
// rows the filtered table left behind, and only gives ground when the window
// itself hasn't got the room.
const ALTURA_PANEL = 320; // preferred height; shrinks when the window can't give it
const ALTURA_MINIMA = 160; // below this, scrolling a list this short is worse than nothing
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
  const [posicion, setPosicion] = useState<{
    top: number;
    left: number;
    alto: number;
  } | null>(null);
  const abierto = posicion !== null;
  const [filtro, setFiltro] = useState("");
  const contenedorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previaARef = useRef<string[]>([]);

  // The panel lives outside contenedorRef in the DOM, so it has to be named
  // explicitly here or every click on a checkbox would read as "outside".
  useClickOutside(contenedorRef, () => setPosicion(null), panelRef);

  // A fixed-position panel doesn't travel with the page: without this it
  // would hang in mid-air next to nothing as soon as anything scrolled.
  // Capture phase, because the scroll that matters is usually the table's or
  // <main>'s, and those don't bubble to window — but capture also hears the
  // panel's own list scrolling, which closed it the instant you tried to
  // reach an option further down. Scrolls born inside the panel are its own
  // business.
  useEffect(() => {
    if (!abierto) return;

    const cerrar = (e: Event) => {
      const objetivo = e.target;
      if (objetivo instanceof Node && panelRef.current?.contains(objetivo)) {
        return;
      }
      setPosicion(null);
    };

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

    // Fresh every time: carrying the previous search over would hide most of
    // the list for reasons the next person opening it can't see.
    setFiltro("");

    const rect = contenedorRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Flip up only when the viewport has no room below *and* there is more
    // room above — measured against the window, not against the table, which
    // was the other half of the original bug.
    const espacioAbajo = window.innerHeight - rect.bottom - SEPARACION - MARGEN_VENTANA;
    const espacioArriba = rect.top - SEPARACION - MARGEN_VENTANA;
    const haciaArriba =
      espacioAbajo < ALTURA_PANEL && espacioArriba > espacioAbajo;

    // A phone in landscape, or any screen with the keyboard up, may not have
    // 320px anywhere. Take what the chosen side actually offers (never below
    // a floor) instead of overflowing off-screen.
    const espacioElegido = haciaArriba ? espacioArriba : espacioAbajo;
    const alto = Math.max(ALTURA_MINIMA, Math.min(ALTURA_PANEL, espacioElegido));

    const top = haciaArriba
      ? Math.max(MARGEN_VENTANA, rect.top - alto - SEPARACION)
      : rect.bottom + SEPARACION;
    const left = Math.max(
      MARGEN_VENTANA,
      Math.min(rect.left, window.innerWidth - ANCHO_PANEL - MARGEN_VENTANA)
    );

    setPosicion({ top, left, alto });
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

  const textoFiltro = filtro.trim().toLowerCase();
  const tareasVisibles = textoFiltro
    ? tareasDisponibles.filter((t) => t.nombre.toLowerCase().includes(textoFiltro))
    : tareasDisponibles;

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
            // Inline style, not Tailwind classes: these numbers are measured
            // at click time and can't be known ahead of build.
            style={{
              top: posicion.top,
              left: posicion.left,
              height: posicion.alto,
            }}
            // flex column so the search box holds its place while only the
            // list underneath scrolls — a search field that scrolls out of
            // view the moment you use it is worse than none.
            className="fixed z-50 flex w-64 flex-col rounded-lg border border-gray-300 bg-white p-2 shadow-lg"
          >
            <div className="relative shrink-0">
              <Search
                size={14}
                className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                placeholder="Buscar tarea"
                // No autofocus on purpose: on a phone it would throw the
                // keyboard up over the list every time a cell is tapped.
                className="w-full rounded border border-gray-200 py-1 pl-7 pr-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-sidebar focus:outline-none"
              />
            </div>

            <hr className="my-2 shrink-0 border-gray-100" />

            <div className="flex-1 overflow-y-auto">
              {tareasVisibles.length === 0 && (
                <p className="px-2 py-1 text-sm text-gray-400">Sin resultados</p>
              )}

              {tareasVisibles.map((tarea) => {
                const esAusente = tarea.id === ausenteId;
                const deshabilitada = ausenteSeleccionada && !esAusente;

                return (
                  <label
                    key={tarea.id}
                    className={`flex items-center gap-2 rounded px-2 py-1 text-sm ${
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
          </div>,
          document.body
        )}
    </div>
  );
}
