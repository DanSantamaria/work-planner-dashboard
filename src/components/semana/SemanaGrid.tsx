"use client";

import { useState } from "react";
import { addDays } from "@/lib/date-utils";
import TareaDropdown from "@/components/semana/TareaDropdown";

const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

function getWeekDays(fechaInicio: string) {
  const monday = new Date(fechaInicio);

  return DAY_NAMES.map((dayName, i) => {
    const date = addDays(monday, i);
    const diaSemana = i + 1;

    return { diaSemana, dayName, date, dayNumber: date.getDate() };
  });
}

function esHoy(date: Date): boolean {
  return date.toDateString() === new Date().toDateString();
}

function getPillClasses(nombre: string): string {
  const esCambioDeTurno = nombre.toUpperCase().includes("CAMBIO TURNO");
  const acento = esCambioDeTurno ? " font-bold" : "";

  if (nombre === "OFICINA") {
    return `bg-[#C7FDFB] text-[#5E8A88] border border-[#5E8A88] rounded-md text-xs px-2 py-1${acento}`;
  }
  if (nombre === "AUSENTE") {
    return `bg-[#FFE0E0] text-[#E81414] font-bold border border-[#E81414] rounded-md text-xs px-2 py-1${acento}`;
  }
  return `bg-gray-50 border text-gray-700 rounded-xl text-xs my-0.4 px-2 py-1${acento}`;
}

function getCeldaAccentColor(asignaciones: AsignacionCelda[]): string | null {
  const nombres = asignaciones.map((a) => a.nombre);
  if (nombres.includes("AUSENTE")) return "#FFE0E0";
  if (nombres.includes("OFICINA")) return "#C7FDFB";
  return null;
}

function getLobColorHex(lob: string): string {
  if (lob === "ESPAÑA") return "#FFE0E0";
  if (lob === "FRANCIA") return "#D4E9FF";
  if (lob === "IRLANDA") return "#F3FFED";
  return "#F2F3FF"; // COORDINACION / Supervisor
}

function CeldaEditable({
  valor,
  onSave,
}: {
  valor: string;
  onSave: (nuevoValor: string) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(valor);

  return (
    <div className="relative min-h-[1.5rem]">
      {editando ? (
        <input
          autoFocus
          className="absolute left-0 top-0 z-40 w-64 rounded border border-blue-400 bg-white px-1 py-0.5 text-gray-700 shadow-md"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onBlur={() => {
            setEditando(false);
            if (texto.trim() && texto !== valor) {
              onSave(texto);
            } else {
              setTexto(valor);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") {
              setTexto(valor);
              setEditando(false);
            }
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setTexto(valor);
            setEditando(true);
          }}
          className="w-full cursor-text text-left"
        >
          {valor || <span className="italic text-gray-400">—</span>}
        </button>
      )}
    </div>
  );
}

type AsignacionCelda = { tareaId: string; nombre: string };
type TareaDisponible = { id: string; nombre: string };

type Props = {
  fechaInicio: string;
  empleados: { id: string; nombre: string; lob: string; horario: string }[];
  tareas: Record<string, Record<number, AsignacionCelda[]>>;
  editable?: boolean;
  tareasDisponibles?: TareaDisponible[];
  onNombreChange?: (empleadoId: string, nuevoNombre: string) => void;
  onHorarioChange?: (empleadoId: string, nuevoHorario: string) => void;
  onTareasChange?: (
    empleadoId: string,
    diaSemana: number,
    nuevasTareaIds: string[]
  ) => void;
};

export default function SemanaGrid({
  fechaInicio,
  empleados,
  tareas,
  editable = false,
  tareasDisponibles = [],
  onNombreChange,
  onHorarioChange,
  onTareasChange,
}: Props) {
  const weekDays = getWeekDays(fechaInicio);

  return (
    <div className="overflow-x-auto overflow-y-hidden rounded-2xl">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-20 w-48 border border-gray-300 bg-[#E6E6E6] px-4 py-3 text-left text-lg text-gray-800">
              Nombre
            </th>
            <th className="sticky left-48 z-20 w-32 border border-gray-300 bg-[#E6E6E6] px-4 py-3 text-left text-lg text-gray-800">
              Horario
            </th>
            {weekDays.map((day) => {
              const hoy = esHoy(day.date);

              return (
                <th
                  key={day.diaSemana}
                  className={`whitespace-nowrap border border-gray-300 bg-[#E6E6E6] px-4 py-3 text-center text-gray-800 ${
                    hoy ? "border-t-4 border-t-[#211E2F]" : ""
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-bold">{day.dayNumber}</span>
                    <span className="text-xs font-normal text-gray-600">
                      {day.dayName}
                    </span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {empleados.map((empleado) => {
            return (
              <tr key={empleado.id} className="bg-white">
                <td
                  style={{ backgroundColor: getLobColorHex(empleado.lob) }}
                  className="border border-gray-300 px-2 font-semibold text-gray-700"
                >
                  {editable ? (
                    <CeldaEditable
                      valor={empleado.nombre}
                      onSave={(nuevo) => onNombreChange?.(empleado.id, nuevo)}
                    />
                  ) : (
                    empleado.nombre
                  )}
                </td>
                <td className="sticky left-48 z-10 w-32 border border-gray-300 bg-white px-4 py-2 text-gray-600">
                  {editable ? (
                    <CeldaEditable
                      valor={empleado.horario}
                      onSave={(nuevo) => onHorarioChange?.(empleado.id, nuevo)}
                    />
                  ) : (
                    empleado.horario
                  )}
                </td>
                {weekDays.map((day) => {
                  const asignacionesCelda = tareas[empleado.id]?.[day.diaSemana] ?? [];
                  const colorAcento = getCeldaAccentColor(asignacionesCelda);

                  return (
                    <td
                      key={day.diaSemana}
                      style={
                        colorAcento
                          ? { borderLeftWidth: "8px", borderLeftColor: colorAcento }
                          : undefined
                      }
                      className="border border-gray-300 px-4 py-2 align-top text-gray-700">
                      {editable ? (
                        <TareaDropdown
                          tareasDisponibles={tareasDisponibles}
                          seleccionadas={asignacionesCelda.map((a) => a.tareaId)}
                          onChange={(nuevasIds) =>
                            onTareasChange?.(empleado.id, day.diaSemana, nuevasIds)
                          }
                        />
                      ) : (
                        <div className="flex max-w-[220px] flex-wrap gap-1">
                          {asignacionesCelda.map((asignacion) => (
                            <span
                              key={asignacion.tareaId}
                              className={getPillClasses(asignacion.nombre)}>
                              {asignacion.nombre}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
