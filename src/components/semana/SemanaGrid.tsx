"use client";

import { useState } from "react";
import { addDays } from "@/lib/date-utils";
import TareaDropdown from "@/components/semana/TareaDropdown";

const DAY_NAMES = ["LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES"];

function getWeekDays(fechaInicio: string) {
  const monday = new Date(fechaInicio);

  return DAY_NAMES.map((dayName, i) => {
    const date = addDays(monday, i);
    const diaSemana = i + 1;

    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();

    return { diaSemana, dayName, dateLabel: `${dd}.${mm}.${yyyy}` };
  });
}

function getCeldaHighlight(asignaciones: AsignacionCelda[]): string {
  const nombres = asignaciones.map((a) => a.nombre);
  if (nombres.includes("AUSENTE")) return "bg-red-100";
  if (nombres.includes("OFICINA")) return "bg-amber-100";
  return "";
}

function getPillClasses(nombre: string): string {
  const base = "bg-gray-50 border text-gray-700 rounded-xl text-xs my-0.4 px-2 py-1";
  const esCambioDeTurno = nombre.toUpperCase().includes("CAMBIO TURNO");
  return esCambioDeTurno ? `${base} font-bold ` : base;
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

  function getLobColor(lob: string) {
    if (lob === "ESPAÑA") return "bg-red-100 text-gray-500";
    if (lob === "FRANCIA") return "bg-blue-100 text-gray-500";
    if (lob === "IRLANDA") return "bg-green-100 text-gray-500";
    return "bg-gray-200 text-gray-500";
  }

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-blue-600 text-white">
            <th className="sticky left-0 z-20 w-48 border border-white border-1 bg-blue-600 px-4 py-3 text-left">
              NOMBRE
            </th>
            <th className="sticky left-48 z-20 w-32 border border-white border-1 bg-blue-600 px-4 py-3 text-left">
              HORARIO
            </th>
            {weekDays.map((day) => (
              <th
                key={day.diaSemana}
                className="whitespace-nowrap border border-white border-1 px-4 py-3 text-left">
                <div className="flex flex-col items-start gap-1">
                  <span>{day.dayName}</span>
                  <div className="h-px w-full bg-white/40" />
                  <span className="text-s font-normal">{day.dateLabel}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {empleados.map((empleado, index) => {
            const rowBg = index % 2 === 0 ? "bg-white" : "bg-gray-100";

            return (
              <tr key={empleado.id} className={rowBg}>
                <td className={`font-semibold px-2 border border-white border-b-2 ${getLobColor(empleado.lob)}`}>
                  {editable ? (
                    <CeldaEditable
                      valor={empleado.nombre}
                      onSave={(nuevo) => onNombreChange?.(empleado.id, nuevo)}
                    />
                  ) : (
                    empleado.nombre
                  )}
                </td>
                <td
                  className={`sticky left-48 z-10 w-32 border border-white border-b-2 px-4 py-2 text-gray-600 ${rowBg}`}>
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

                  return (
                    <td
                      key={day.diaSemana}
                      className={`border border-white border-b-2 border-l-2 px-4 py-2 align-top text-gray-700 ${getCeldaHighlight(asignacionesCelda)}`}>
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
