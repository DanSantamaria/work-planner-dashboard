"use client";

import { useRef, useState } from "react";
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
  const contenedorTablaRef = useRef<HTMLDivElement>(null);

  return (
    <GridTable ref={contenedorTablaRef} layoutClase="table-fixed">
      <thead>
        <tr>
          <NombreHeaderCell anchoClase="w-56">Nombre</NombreHeaderCell>
          <NombreHeaderCell anchoClase="w-32" stickyLeftClase="left-56">
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
            <tr key={empleado.id} className="bg-white">
              <td
                className={`w-56 border border-gray-300 bg-white pl-6 pr-2 font-semibold text-gray-700 ${getLobBorderClass(empleado.lob)}`}
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
              <td className="sticky left-56 z-10 w-32 border border-gray-300 bg-white px-4 py-2 text-gray-600">
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
                        contenedorTablaRef={contenedorTablaRef}
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
