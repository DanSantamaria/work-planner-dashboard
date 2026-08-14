"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { getMonday, getGrillaMes } from "@/lib/date-utils";

const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

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

type Props = {
  fecha: Date;
  modo: "DIARIO" | "SEMANAL" | "MENSUAL";
  onSeleccionar: (fecha: Date) => void;
};

function mismoDia(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

function agruparEnFilas<T>(items: T[], tamano: number): T[][] {
  const filas: T[][] = [];
  for (let i = 0; i < items.length; i += tamano) {
    filas.push(items.slice(i, i + tamano));
  }
  return filas;
}

export default function SelectorFecha({ fecha, modo, onSeleccionar }: Props) {
  // The month/year both panels are currently browsing — starts wherever the
  // calendar is currently looking, but can be navigated independently via
  // the arrows without changing the actual selected fecha until a day or
  // month is actually clicked. One shared cursor for both panels means
  // stepping the year on the right automatically keeps the left panel's
  // month in sync, with no separate coordination code needed.
  const [cursor, setCursor] = useState(fecha);

  const hoy = new Date();
  const grilla = getGrillaMes(cursor);
  const filas = agruparEnFilas(grilla, 7);
  const semanaSeleccionada = modo === "SEMANAL" ? getMonday(fecha) : null;

  function irMesAnterior() {
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function irMesSiguiente() {
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  function irAnioAnterior() {
    setCursor((prev) => new Date(prev.getFullYear() - 1, prev.getMonth(), 1));
  }

  function irAnioSiguiente() {
    setCursor((prev) => new Date(prev.getFullYear() + 1, prev.getMonth(), 1));
  }

  return (
    <div className="flex gap-4 rounded-lg border border-gray-700 bg-sidebar p-4 text-white shadow-xl">
      <div className="w-64">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-semibold">
            {NOMBRES_MES[cursor.getMonth()]} {cursor.getFullYear()}
          </span>
          <div className="flex flex-col">
            <button
              type="button"
              onClick={irMesAnterior}
              className="cursor-pointer text-gray-300 hover:text-white"
              aria-label="Mes anterior"
            >
              <ChevronUp size={16} />
            </button>
            <button
              type="button"
              onClick={irMesSiguiente}
              className="cursor-pointer text-gray-300 hover:text-white"
              aria-label="Mes siguiente"
            >
              <ChevronDown size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 text-center text-xs text-gray-400">
          {DIAS_SEMANA.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>

        <div className="mt-1 flex flex-col gap-1">
          {filas.map((fila) => {
            const esSemanaSeleccionada =
              semanaSeleccionada !== null &&
              mismoDia(fila[0], semanaSeleccionada);

            return (
              <div
                key={fila[0].toISOString()}
                className={`grid grid-cols-7 rounded-md ${
                  esSemanaSeleccionada ? "border border-accent" : ""
                }`}
              >
                {fila.map((dia) => {
                  const enMesActual = dia.getMonth() === cursor.getMonth();
                  const esHoy = mismoDia(dia, hoy);
                  const esDiaSeleccionado =
                    modo === "DIARIO" && mismoDia(dia, fecha);

                  return (
                    <button
                      key={dia.toISOString()}
                      type="button"
                      onClick={() => onSeleccionar(dia)}
                      className={`cursor-pointer rounded-full py-1 text-center text-sm ${
                        enMesActual ? "text-white" : "text-gray-500"
                      } ${esHoy ? "bg-accent font-bold" : ""} ${
                        esDiaSeleccionado ? "ring-2 ring-accent" : ""
                      }`}
                    >
                      {dia.getDate()}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-48 border-l border-gray-700 pl-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-semibold">{cursor.getFullYear()}</span>
          <div className="flex flex-col">
            <button
              type="button"
              onClick={irAnioAnterior}
              className="cursor-pointer text-gray-300 hover:text-white"
              aria-label="Año anterior"
            >
              <ChevronUp size={16} />
            </button>
            <button
              type="button"
              onClick={irAnioSiguiente}
              className="cursor-pointer text-gray-300 hover:text-white"
              aria-label="Año siguiente"
            >
              <ChevronDown size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {NOMBRES_MES.map((nombre, indiceMes) => {
            const esMesSeleccionado =
              cursor.getFullYear() === fecha.getFullYear() &&
              indiceMes === fecha.getMonth();

            return (
              <button
                key={nombre}
                type="button"
                onClick={() => {
                  const nuevaFecha = new Date(cursor.getFullYear(), indiceMes, 1);
                  setCursor(nuevaFecha);
                  onSeleccionar(nuevaFecha);
                }}
                className={`cursor-pointer rounded-md py-2 text-center text-sm ${
                  esMesSeleccionado
                    ? "bg-accent font-bold"
                    : "text-white hover:bg-white/10"
                }`}
              >
                {nombre.slice(0, 3)}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            const hoy = new Date();
            setCursor(hoy);
            onSeleccionar(hoy);
          }}
          className="mt-4 cursor-pointer text-sm text-gray-300 hover:text-white"
        >
          Hoy
        </button>
      </div>
    </div>
  );
}
