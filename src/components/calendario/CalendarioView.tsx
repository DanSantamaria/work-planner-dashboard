"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar1, CalendarPlus, ChevronDown, Funnel } from "lucide-react";
import { getMonday, addDays } from "@/lib/date-utils";
import { useBusqueda } from "@/context/BusquedaContext";
import { useClickOutside } from "@/hooks/useClickOutside";
import { resolverCelda } from "@/lib/calendario-celda";
import type { FeriadoCalendario } from "@/lib/calendario-celda";
import Button from "@/components/ui/Button";
import DayView from "@/components/calendario/DayView";
import WeekGrid from "@/components/calendario/WeekGrid";
import MonthGrid from "@/components/calendario/MonthGrid";
import EventoModal, { type EventoCompleto } from "@/components/calendario/EventoModal";
import FeriadoForm, { type Feriado } from "@/components/calendario/FeriadoForm";
import SelectorFecha from "@/components/calendario/SelectorFecha";

type Modo = "DIARIO" | "SEMANAL" | "MENSUAL";

const ETIQUETAS_MODO: Record<Modo, string> = {
  DIARIO: "Día",
  SEMANAL: "Semana",
  MENSUAL: "Mes",
};

type Empleado = { id: string; nombre: string; lob: string };

type Props = {
  empleados: Empleado[];
  isStaff: boolean;
};

function calcularRango(modo: Modo, fecha: Date): { desde: Date; hasta: Date } {
  if (modo === "DIARIO") {
    return { desde: fecha, hasta: fecha };
  }

  if (modo === "SEMANAL") {
    const inicio = getMonday(fecha);
    return { desde: inicio, hasta: addDays(inicio, 6) };
  }

  const inicio = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
  const fin = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
  return { desde: inicio, hasta: fin };
}

function avanzar(modo: Modo, fecha: Date, direccion: 1 | -1): Date {
  if (modo === "DIARIO") return addDays(fecha, direccion);
  if (modo === "SEMANAL") return addDays(fecha, direccion * 7);
  return new Date(fecha.getFullYear(), fecha.getMonth() + direccion, 1);
}

// NOT fecha.toISOString().slice(0, 10) — that converts to UTC, which
// silently shifts the date back a day for anyone east of UTC (e.g. Spain).
// These Date objects are built from local calendar components (getMonday,
// addDays, new Date(y, m, d)), so they must be read back the same way.
function formatoFecha(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

const NOMBRES_MES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

// The human-readable label between the ← → arrows — not the same string as
// formatoFecha above, which builds an API query param, not display text.
function formatearRangoVisible(modo: Modo, fecha: Date): string {
  if (modo === "DIARIO") {
    return `${fecha.getDate()} ${NOMBRES_MES[fecha.getMonth()]}, ${fecha.getFullYear()}`;
  }

  if (modo === "SEMANAL") {
    const inicio = getMonday(fecha);
    const fin = addDays(inicio, 6);
    const mismoAnio = inicio.getFullYear() === fin.getFullYear();
    const mismoMes = mismoAnio && inicio.getMonth() === fin.getMonth();

    if (mismoMes) {
      return `${inicio.getDate()}-${fin.getDate()} ${NOMBRES_MES[inicio.getMonth()]}, ${inicio.getFullYear()}`;
    }

    if (mismoAnio) {
      return `${inicio.getDate()} ${NOMBRES_MES[inicio.getMonth()]} - ${fin.getDate()} ${NOMBRES_MES[fin.getMonth()]}, ${inicio.getFullYear()}`;
    }

    return `${inicio.getDate()} ${NOMBRES_MES[inicio.getMonth()]}, ${inicio.getFullYear()} - ${fin.getDate()} ${NOMBRES_MES[fin.getMonth()]}, ${fin.getFullYear()}`;
  }

  return `${NOMBRES_MES[fecha.getMonth()]}, ${fecha.getFullYear()}`;
}

export default function CalendarioView({ empleados, isStaff }: Props) {
  const { busqueda } = useBusqueda();
  const [modo, setModo] = useState<Modo>("MENSUAL");
  const [fecha, setFecha] = useState(new Date());
  const [datos, setDatos] = useState<{
    rango: string;
    eventos: EventoCompleto[];
    feriados: FeriadoCalendario[];
  } | null>(null);
  const [refrescoContador, setRefrescoContador] = useState(0);

  const [modalEventoAbierto, setModalEventoAbierto] = useState(false);
  const [eventoEnEdicion, setEventoEnEdicion] = useState<EventoCompleto | null>(null);
  const [prellenadoEvento, setPrellenadoEvento] = useState<{
    empleadoId: string;
    fecha: string;
  } | null>(null);

  const [modalFeriadoAbierto, setModalFeriadoAbierto] = useState(false);
  const [feriadoEnEdicion, setFeriadoEnEdicion] = useState<Feriado | null>(null);
  const [prellenadoFeriado, setPrellenadoFeriado] = useState<string | null>(null);

  const [menuNuevoAbierto, setMenuNuevoAbierto] = useState(false);
  const menuNuevoRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuNuevoRef, () => setMenuNuevoAbierto(false));

  const [selectorFechaAbierto, setSelectorFechaAbierto] = useState(false);
  const selectorFechaRef = useRef<HTMLDivElement>(null);
  useClickOutside(selectorFechaRef, () => setSelectorFechaAbierto(false));

  const { desde, hasta } = calcularRango(modo, fecha);
  const desdeStr = formatoFecha(desde);
  const hastaStr = formatoFecha(hasta);
  const rangoActual = `${desdeStr}_${hastaStr}`;

  // Loading is derived from whether the fetched data matches the currently
  // requested range, instead of a separate setCargando(true)/false pair —
  // setting state synchronously the moment an effect fires causes an extra
  // render before the fetch has even started.
  const cargando = datos?.rango !== rangoActual;
  const eventos = cargando ? [] : datos.eventos;
  const feriados = cargando ? [] : datos.feriados;

  useEffect(() => {
    let cancelado = false;
    const params = `desde=${desdeStr}&hasta=${hastaStr}`;
    const rango = `${desdeStr}_${hastaStr}`;

    Promise.all([
      fetch(`/api/eventos?${params}`).then((res) => res.json()),
      fetch(`/api/feriados?${params}`).then((res) => res.json()),
    ]).then(([eventosData, feriadosData]) => {
      if (cancelado) return;
      setDatos({ rango, eventos: eventosData, feriados: feriadosData });
    });

    return () => {
      cancelado = true;
    };
  }, [desdeStr, hastaStr, refrescoContador]);

  const empleadosFiltrados = empleados.filter((empleado) =>
    empleado.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  function irAHoy() {
    setFecha(new Date());
  }

  function irAnterior() {
    setFecha((prev) => avanzar(modo, prev, -1));
  }

  function irSiguiente() {
    setFecha((prev) => avanzar(modo, prev, 1));
  }

  // Only picks the date — deliberately does NOT close the popover, so you
  // can pick a day, then still browse to a different month/year and pick
  // again, closing only via useClickOutside when you're actually done.
  function handleSeleccionarFecha(nuevaFecha: Date) {
    setFecha(nuevaFecha);
  }

  function handleGuardado() {
    setRefrescoContador((n) => n + 1);
  }

  function handleNuevoEvento() {
    setEventoEnEdicion(null);
    setPrellenadoEvento(null);
    setModalEventoAbierto(true);
  }

  function handleNuevoFeriado() {
    setFeriadoEnEdicion(null);
    setPrellenadoFeriado(null);
    setModalFeriadoAbierto(true);
  }

  // Interim click-routing using the old two-modal setup — cerrado/evento
  // can now both be true at once (checkpoint 1's point), but the tabbed
  // Evento/Feriado modal that actually resolves which one a click should
  // open is checkpoint 2/3, not built yet. This keeps the file compiling
  // against the new CeldaInfo shape with equivalent-to-before behavior in
  // the meantime.
  function handleDiaClick(empleadoId: string, diaFecha: Date) {
    const celda = resolverCelda(diaFecha, empleadoId, eventos, feriados);
    const fechaStr = formatoFecha(diaFecha);

    if (celda.evento) {
      setEventoEnEdicion(celda.evento.data);
      setPrellenadoEvento(null);
      setModalEventoAbierto(true);
      return;
    }

    if (celda.feriado) {
      setFeriadoEnEdicion(celda.feriado);
      setPrellenadoFeriado(null);
      setModalFeriadoAbierto(true);
      return;
    }

    if (celda.finDeSemana) {
      return;
    }

    setEventoEnEdicion(null);
    setPrellenadoEvento({ empleadoId, fecha: fechaStr });
    setModalEventoAbierto(true);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="lg" onClick={irAHoy}>
            <Calendar1 size={22} />
            Hoy
          </Button>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="lg"
              onClick={irAnterior}
              className="text-lg font-bold text-accent"
            >
              ◀
            </Button>
            <span className="text-md font-bold text-accent">
              {formatearRangoVisible(modo, fecha)}
            </span>
            <Button
              variant="ghost"
              size="lg"
              onClick={irSiguiente}
              className="text-lg font-bold text-accent"
            >
              ▶
            </Button>
            <div ref={selectorFechaRef} className="relative">
              <button
                type="button"
                onClick={() => setSelectorFechaAbierto((prev) => !prev)}
                className="cursor-pointer text-sidebar hover:opacity-70"
                aria-label="Ir a una fecha"
              >
                <Funnel size={18} />
              </button>
              {selectorFechaAbierto && (
                <div className="absolute left-0 z-30 mt-1">
                  <SelectorFecha
                    fecha={fecha}
                    modo={modo}
                    onSeleccionar={handleSeleccionarFecha}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {(Object.keys(ETIQUETAS_MODO) as Modo[]).map((m) => (
            <Button
              key={m}
              variant={modo === m ? "primary" : "ghost"}
              size="sm"
              onClick={() => setModo(m)}
            >
              {ETIQUETAS_MODO[m]}
            </Button>
          ))}
        </div>

        {isStaff && (
          <div ref={menuNuevoRef} className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMenuNuevoAbierto((prev) => !prev)}
              className="rounded-lg !bg-sidebar px-4 py-2 text-white hover:opacity-90"
            >
              <CalendarPlus size={18} />
              Evento
              <span className="mx-1 h-5 w-px bg-white/30" />
              <ChevronDown size={16} />
            </Button>
            {menuNuevoAbierto && (
              <div className="absolute right-0 z-30 mt-1 w-36 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    handleNuevoEvento();
                    setMenuNuevoAbierto(false);
                  }}
                  className="block w-full cursor-pointer rounded px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Evento
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleNuevoFeriado();
                    setMenuNuevoAbierto(false);
                  }}
                  className="block w-full cursor-pointer rounded px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Feriado
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {cargando ? (
        <p className="text-sm text-gray-500">Cargando...</p>
      ) : modo === "DIARIO" ? (
        <DayView
          fecha={fecha}
          empleados={empleadosFiltrados}
          eventos={eventos}
          feriados={feriados}
          isStaff={isStaff}
          onDiaClick={isStaff ? handleDiaClick : undefined}
        />
      ) : modo === "SEMANAL" ? (
        <WeekGrid
          fecha={fecha}
          empleados={empleadosFiltrados}
          eventos={eventos}
          feriados={feriados}
          isStaff={isStaff}
          onDiaClick={isStaff ? handleDiaClick : undefined}
        />
      ) : (
        <MonthGrid
          fecha={fecha}
          empleados={empleadosFiltrados}
          eventos={eventos}
          feriados={feriados}
          isStaff={isStaff}
          onDiaClick={isStaff ? handleDiaClick : undefined}
        />
      )}

      {isStaff && (
        <>
          <EventoModal
            key={
              eventoEnEdicion?.id ??
              (prellenadoEvento
                ? `evento-${prellenadoEvento.empleadoId}_${prellenadoEvento.fecha}`
                : "evento-nuevo")
            }
            open={modalEventoAbierto}
            onClose={() => setModalEventoAbierto(false)}
            empleados={empleados}
            eventoExistente={eventoEnEdicion}
            prellenado={prellenadoEvento}
            onGuardado={handleGuardado}
          />
          <FeriadoForm
            key={feriadoEnEdicion?.id ?? prellenadoFeriado ?? "feriado-nuevo"}
            open={modalFeriadoAbierto}
            onClose={() => setModalFeriadoAbierto(false)}
            feriadoExistente={feriadoEnEdicion}
            fechaPrellenada={prellenadoFeriado}
            onGuardado={handleGuardado}
          />
        </>
      )}
    </div>
  );
}
