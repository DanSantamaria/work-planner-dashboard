"use client";

import { useEffect, useRef, useState } from "react";
import {
  Calendar1,
  CalendarPlus,
  ChevronDown,
  ChevronUp,
  Funnel,
  LayoutGrid,
} from "lucide-react";
import { getMonday, addDays } from "@/lib/date-utils";
import { useBusqueda } from "@/context/BusquedaContext";
import { useClickOutside } from "@/hooks/useClickOutside";
import { resolverCelda, resolverVarianteEvento } from "@/lib/calendario-celda";
import type { FeriadoCalendario } from "@/lib/calendario-celda";
import { ETIQUETAS } from "@/components/calendario/CeldaCalendario";
import Button from "@/components/ui/Button";
import DayView from "@/components/calendario/DayView";
import WeekGrid from "@/components/calendario/WeekGrid";
import MonthGrid from "@/components/calendario/MonthGrid";
import type { EventoCompleto } from "@/components/calendario/EventoModal";
import type { Feriado } from "@/components/calendario/FeriadoForm";
import EventoFeriadoModal, { type Tab } from "@/components/calendario/EventoFeriadoModal";
import SelectorFecha from "@/components/calendario/SelectorFecha";
import BalanceTable, { type Empleado } from "@/components/calendario/BalanceTable";

type Modo = "DIARIO" | "SEMANAL" | "MENSUAL";

const ETIQUETAS_MODO: Record<Modo, string> = {
  DIARIO: "Día",
  SEMANAL: "Semana",
  MENSUAL: "Mes",
};

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

  // One modal now, not two — conditional rendering ({modalAbierto && ...})
  // replaces the old open-prop pattern, so a fresh EventoFeriadoModal
  // instance mounts every time it opens instead of needing a key trick to
  // force it. tabInicial is just the modal's starting tab, not a lock —
  // both evento/feriado fill-in state stay available so switching tabs
  // inside the modal always has sensible data on both sides.
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tabInicial, setTabInicial] = useState<Tab>("EVENTO");
  const [eventoEnEdicion, setEventoEnEdicion] = useState<EventoCompleto | null>(null);
  const [prellenadoEvento, setPrellenadoEvento] = useState<{
    empleadoId: string;
    fecha: string;
  } | null>(null);
  const [feriadoEnEdicion, setFeriadoEnEdicion] = useState<Feriado | null>(null);
  const [prellenadoFeriado, setPrellenadoFeriado] = useState<string | null>(null);

  const [menuNuevoAbierto, setMenuNuevoAbierto] = useState(false);
  const menuNuevoRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuNuevoRef, () => setMenuNuevoAbierto(false));

  // Collapsed by default, matching the mockup — instant show/hide, no
  // animation, same simplicity level as the modal/popover patterns above.
  const [balanceAbierto, setBalanceAbierto] = useState(false);

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

  // Same pattern as /semana's "empleado o tarea" search: an employee
  // stays visible if their name matches OR if any of their events in the
  // currently-loaded date range does (e.g. typing "vacaciones" surfaces
  // everyone on vacation right now, not their whole history).
  const textoBusqueda = busqueda.toLowerCase();
  const empleadosFiltrados = empleados.filter((empleado) => {
    const coincideNombre = empleado.nombre.toLowerCase().includes(textoBusqueda);
    const coincideEvento = eventos.some(
      (evento) =>
        evento.empleadoId === empleado.id &&
        ETIQUETAS[resolverVarianteEvento(evento)]
          .toLowerCase()
          .includes(textoBusqueda)
    );

    return coincideNombre || coincideEvento;
  });

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

  // Used by the "+ Evento"/"+ Feriado" dropdown items — both start empty
  // (create mode), only the starting tab differs.
  function handleNuevo(tab: Tab) {
    setEventoEnEdicion(null);
    setPrellenadoEvento(null);
    setFeriadoEnEdicion(null);
    setPrellenadoFeriado(null);
    setTabInicial(tab);
    setModalAbierto(true);
  }

  // Both tabs always get sensible data, regardless of which one opens by
  // default — an existing record on this date/employee means that tab
  // opens in edit mode; otherwise it's pre-filled to create one. That way
  // switching tabs inside the modal (e.g. to add a personal event on a
  // day that's also a feriado) never lands on stale or empty data.
  function handleDiaClick(empleadoId: string, diaFecha: Date) {
    const celda = resolverCelda(diaFecha, empleadoId, eventos, feriados);
    const fechaStr = formatoFecha(diaFecha);

    setEventoEnEdicion(celda.evento?.data ?? null);
    setPrellenadoEvento(celda.evento ? null : { empleadoId, fecha: fechaStr });

    setFeriadoEnEdicion(celda.feriado);
    setPrellenadoFeriado(celda.feriado ? null : fechaStr);

    setTabInicial(celda.evento ? "EVENTO" : celda.feriado ? "FERIADO" : "EVENTO");
    setModalAbierto(true);
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

        <div className="flex items-center gap-2">
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
                      handleNuevo("EVENTO");
                      setMenuNuevoAbierto(false);
                    }}
                    className="block w-full cursor-pointer rounded px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Evento
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleNuevo("FERIADO");
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
          <Button
            variant="primary"
            size="sm"
            onClick={() => setBalanceAbierto((prev) => !prev)}
            className="!h-9 !px-4 !py-2"
          >
            <LayoutGrid size={18} />
            Grupos y Totales
            {balanceAbierto ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </Button>
        </div>
      </div>

      {/* grid-rows-[0fr]→[1fr] instead of height:auto — CSS can't
          transition to/from auto, but it can transition a fr track, so
          the inner overflow-hidden wrapper's content clips smoothly
          instead of snapping open/closed. BalanceTable stays mounted at
          all times (never conditionally rendered) since this animation
          needs the DOM to persist across the transition. */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          balanceAbierto ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="mb-6">
            <BalanceTable initialEmpleados={empleados} isStaff={isStaff} />
          </div>
        </div>
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

      {isStaff && modalAbierto && (
        <EventoFeriadoModal
          tabInicial={tabInicial}
          onClose={() => setModalAbierto(false)}
          empleados={empleados}
          eventoExistente={eventoEnEdicion}
          prellenadoEvento={prellenadoEvento}
          feriadoExistente={feriadoEnEdicion}
          prellenadoFeriado={prellenadoFeriado}
          onGuardado={handleGuardado}
        />
      )}
    </div>
  );
}
