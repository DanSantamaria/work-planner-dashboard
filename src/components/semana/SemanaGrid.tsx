"use client";

import { useState } from "react";
import { addDays } from "@/lib/date-utils";
import TareaDropdown from "@/components/semana/TareaDropdown";
import Badge from "@/components/ui/Badge";
import {
  GridTable,
  NombreHeaderCell,
  DiaHeaderCell,
} from "@/components/ui/GridTable";
import { getLobBorderClass } from "@/lib/lob-color";

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

function getPillVariant(
  nombre: string
): "oficina" | "ausente" | "recepcion" | "tarea" {
  if (nombre === "OFICINA") return "oficina";
  if (nombre === "AUSENTE") return "ausente";
  if (nombre === "RECEPCION") return "recepcion";
  return "tarea";
}

function esPillBold(nombre: string): boolean {
  return nombre === "AUSENTE" || nombre.toUpperCase().includes("CAMBIO TURNO");
}

function getCeldaAccentClass(asignaciones: AsignacionCelda[]): string {
  const nombres = asignaciones.map((a) => a.nombre);
  if (nombres.includes("AUSENTE")) return "border-l-8 border-l-ausente-bg";
  if (nombres.includes("OFICINA")) return "border-l-8 border-l-oficina-bg";
  return "";
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
          className="absolute left-0 top-0 z-40 w-64 rounded border border-sidebar bg-white px-1 py-0.5 text-gray-700 shadow-md"
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
  /**
   * When set (1..5), only that weekday's column is rendered — the daily view.
   * Filtering the column out beats hiding it with CSS: the table is
   * `table-fixed`, so a hidden column would still reserve its width and leave
   * a wide empty gap next to the single day.
   */
  diaVisible?: number;
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
  diaVisible,
  empleados,
  tareas,
  editable = false,
  tareasDisponibles = [],
  onNombreChange,
  onHorarioChange,
  onTareasChange,
}: Props) {
  const todosLosDias = getWeekDays(fechaInicio);
  const weekDays =
    diaVisible === undefined
      ? todosLosDias
      : todosLosDias.filter((day) => day.diaSemana === diaVisible);

  // table-fixed splits the available width between the declared columns, so
  // without a floor it squeezes five days into a phone instead of overflowing.
  // The minimum is what the columns need to stay readable; past that the
  // wrapper takes over and scrolls sideways. Día needs far less, so it says so
  // — otherwise a single column would scroll for no reason.
  const anchoMinimoClase =
    diaVisible === undefined ? "min-w-[56rem]" : "min-w-[26rem]";

  return (
    <GridTable layoutClase={`table-fixed ${anchoMinimoClase}`}>
      <thead>
        <tr>
          <NombreHeaderCell anchoClase="w-36 md:w-56">Nombre</NombreHeaderCell>
          <NombreHeaderCell anchoClase="w-24 md:w-32" fijo={false}>
            Horario
          </NombreHeaderCell>
          {weekDays.map((day) => (
            <DiaHeaderCell
              key={day.diaSemana}
              numero={day.dayNumber}
              nombreDia={day.dayName}
              hoy={esHoy(day.date)}
              numeroClase="text-3xl"
            />
          ))}
        </tr>
      </thead>
      <tbody>
        {empleados.map((empleado) => {
          return (
            <tr key={empleado.id} className="group bg-white hover:bg-row-hover">
              <td
                className={`sticky left-0 z-10 w-36 border border-gray-300 bg-white pl-6 pr-2 font-semibold text-gray-700 group-hover:bg-row-hover md:w-56 ${getLobBorderClass(empleado.lob)}`}
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
              <td className="w-24 border border-gray-300 bg-white px-2 py-2 text-gray-600 group-hover:bg-row-hover md:w-32 md:px-4">
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
                const claseAcento = getCeldaAccentClass(asignacionesCelda);

                return (
                  <td
                    key={day.diaSemana}
                    className={`border border-gray-300 px-4 py-2 align-top text-gray-700 ${claseAcento}`}>
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
                          <Badge
                            key={asignacion.tareaId}
                            variant={getPillVariant(asignacion.nombre)}
                            bold={esPillBold(asignacion.nombre)}
                          >
                            {asignacion.nombre}
                          </Badge>
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
    </GridTable>
  );
}
