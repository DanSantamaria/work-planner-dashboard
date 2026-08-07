"use client";

import { getMonday, addDays } from "@/lib/date-utils";
import { resolverCelda } from "@/lib/calendario-celda";
import type { EventoCalendario, FeriadoCalendario } from "@/lib/calendario-celda";
import { getLobBorderClass } from "@/lib/lob-color";
import CeldaCalendario from "@/components/calendario/CeldaCalendario";
import {
  GridTable,
  NombreHeaderCell,
  DiaHeaderCell,
} from "@/components/ui/GridTable";

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
    <GridTable>
      <thead>
        <tr>
          <NombreHeaderCell anchoClase="w-56">Nombre</NombreHeaderCell>
          {dias.map((dia) => (
            <DiaHeaderCell
              key={dia.fecha.toISOString()}
              numero={dia.fecha.getDate()}
              nombreDia={dia.nombre}
              hoy={esHoy(dia.fecha)}
            />
          ))}
        </tr>
      </thead>
      <tbody>
        {empleados.map((empleado) => (
          <tr key={empleado.id} className="bg-white">
            <td
              className={`sticky left-0 z-10 border border-gray-300 bg-white pl-8 pr-4 py-2 font-semibold text-gray-700 ${getLobBorderClass(empleado.lob)}`}
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
                  className={`border border-gray-300 px-2 py-1 align-top ${
                    celda.cerrado ? "bg-feriado-bg" : ""
                  }`}
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
    </GridTable>
  );
}
