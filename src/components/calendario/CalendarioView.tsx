"use client";

import { useEffect, useState } from "react";
import { getMonday, addDays } from "@/lib/date-utils";
import { useBusqueda } from "@/context/BusquedaContext";
import type { EventoCalendario, FeriadoCalendario } from "@/lib/calendario-celda";
import Button from "@/components/ui/Button";
import DayView from "@/components/calendario/DayView";
import WeekGrid from "@/components/calendario/WeekGrid";
import MonthGrid from "@/components/calendario/MonthGrid";

type Modo = "DIARIO" | "SEMANAL" | "MENSUAL" | "MULTI_MES";

const MESES_MULTI_MES = 3;

const ETIQUETAS_MODO: Record<Modo, string> = {
  DIARIO: "Día",
  SEMANAL: "Semana",
  MENSUAL: "Mes",
  MULTI_MES: "3 meses",
};

type Empleado = { id: string; nombre: string };

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

  if (modo === "MENSUAL") {
    const inicio = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
    const fin = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
    return { desde: inicio, hasta: fin };
  }

  const inicio = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
  const fin = new Date(
    fecha.getFullYear(),
    fecha.getMonth() + MESES_MULTI_MES,
    0
  );
  return { desde: inicio, hasta: fin };
}

function avanzar(modo: Modo, fecha: Date, direccion: 1 | -1): Date {
  if (modo === "DIARIO") return addDays(fecha, direccion);
  if (modo === "SEMANAL") return addDays(fecha, direccion * 7);
  if (modo === "MENSUAL") {
    return new Date(fecha.getFullYear(), fecha.getMonth() + direccion, 1);
  }
  return new Date(
    fecha.getFullYear(),
    fecha.getMonth() + direccion * MESES_MULTI_MES,
    1
  );
}

function formatoFecha(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

export default function CalendarioView({ empleados, isStaff }: Props) {
  const { busqueda } = useBusqueda();
  const [modo, setModo] = useState<Modo>("MENSUAL");
  const [fecha, setFecha] = useState(new Date());
  const [datos, setDatos] = useState<{
    rango: string;
    eventos: EventoCalendario[];
    feriados: FeriadoCalendario[];
  } | null>(null);

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
  }, [desdeStr, hastaStr]);

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

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={irAnterior}>
            ←
          </Button>
          <Button variant="ghost" size="sm" onClick={irAHoy}>
            Hoy
          </Button>
          <Button variant="secondary" size="sm" onClick={irSiguiente}>
            →
          </Button>
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
        />
      ) : modo === "SEMANAL" ? (
        <WeekGrid
          fecha={fecha}
          empleados={empleadosFiltrados}
          eventos={eventos}
          feriados={feriados}
          isStaff={isStaff}
        />
      ) : modo === "MENSUAL" ? (
        <MonthGrid
          fecha={fecha}
          empleados={empleadosFiltrados}
          eventos={eventos}
          feriados={feriados}
          isStaff={isStaff}
        />
      ) : (
        <div className="flex gap-6 overflow-x-auto">
          {Array.from({ length: MESES_MULTI_MES }, (_, i) => {
            const mesFecha = new Date(fecha.getFullYear(), fecha.getMonth() + i, 1);
            return (
              <div key={i} className="min-w-[320px] flex-1">
                <MonthGrid
                  fecha={mesFecha}
                  empleados={empleadosFiltrados}
                  eventos={eventos}
                  feriados={feriados}
                  isStaff={isStaff}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
