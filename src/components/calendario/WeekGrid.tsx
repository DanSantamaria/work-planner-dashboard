"use client";

import { getMonday, addDays } from "@/lib/date-utils";
import { resolverCelda } from "@/lib/calendario-celda";
import type { EventoCalendario, FeriadoCalendario } from "@/lib/calendario-celda";
import { getLobColorClass } from "@/lib/lob-color";
import CeldaCalendario from "@/components/calendario/CeldaCalendario";

const DAY_NAMES = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

function esHoy(date: Date): boolean {
  return date.toDateString() === new Date().toDateString();
}

type Empleado = { id: string; nombre: string; lob: string };

type Props = {
  fecha: Date; // any date within the desired week
  empleados: Empleado[];
  eventos: EventoCalendario[];
  feriados: FeriadoCalendario[];
  isStaff: boolean;
  onDiaClick?: (empleadoId: string, fecha: Date) => void;
};

export default function WeekGrid({
  fecha,
  empleados,
  eventos,
  feriados,
  isStaff,
  onDiaClick,
}: Props) {
  const monday = getMonday(fecha);
  const dias = DAY_NAMES.map((nombre, i) => ({
    nombre,
    fecha: addDays(monday, i),
  }));

  return (
    <div className="overflow-x-auto overflow-y-hidden rounded-2xl">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-20 w-48 border border-gray-300 bg-table-header px-4 py-3 text-left text-lg text-gray-800">
              Nombre
            </th>
            {dias.map((dia) => (
              <th
                key={dia.fecha.toISOString()}
                className={`whitespace-nowrap border border-gray-300 bg-table-header px-4 py-3 text-center text-gray-800 ${
                  esHoy(dia.fecha) ? "border-t-4 border-t-sidebar" : ""
                }`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold">
                    {dia.fecha.getDate()}
                  </span>
                  <span className="text-xs font-normal text-gray-600">
                    {dia.nombre}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {empleados.map((empleado) => (
            <tr key={empleado.id} className="bg-white">
              <td
                className={`sticky left-0 z-10 border border-gray-300 px-4 py-2 font-semibold text-gray-700 ${getLobColorClass(empleado.lob)}`}
              >
                {empleado.nombre}
              </td>
              {dias.map((dia) => {
                const celda = resolverCelda(
                  dia.fecha,
                  empleado.id,
                  eventos,
                  feriados
                );

                return (
                  <td
                    key={dia.fecha.toISOString()}
                    className="border border-gray-300 px-2 py-1 align-top"
                  >
                    <CeldaCalendario
                      celda={celda}
                      onClick={
                        isStaff
                          ? () => onDiaClick?.(empleado.id, dia.fecha)
                          : undefined
                      }
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
