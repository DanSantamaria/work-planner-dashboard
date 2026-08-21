"use client";

import { resolverCelda } from "@/lib/calendario-celda";
import type { EventoCalendario, FeriadoCalendario } from "@/lib/calendario-celda";
import { getLobBorderClass } from "@/lib/lob-color";
import CeldaCalendario, {
  CELDA_BG_CLASSES,
} from "@/components/calendario/CeldaCalendario";
import {
  GridTable,
  NombreHeaderCell,
  DiaHeaderCell,
} from "@/components/ui/GridTable";

const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

function esHoy(date: Date): boolean {
  return date.toDateString() === new Date().toDateString();
}

type Empleado = { id: string; nombre: string; lob: string };

type Props = {
  fecha: Date;
  empleados: Empleado[];
  eventos: EventoCalendario[];
  feriados: FeriadoCalendario[];
  isStaff: boolean;
  onDiaClick?: (empleadoId: string, fecha: Date) => void;
};

export default function DayView({
  fecha,
  empleados,
  eventos,
  feriados,
  isStaff,
  onDiaClick,
}: Props) {
  return (
    <GridTable>
      <thead>
        <tr>
          <NombreHeaderCell anchoClase="w-36 md:w-56">Nombre</NombreHeaderCell>
          <DiaHeaderCell
            numero={fecha.getDate()}
            nombreDia={DAY_NAMES[fecha.getDay()]}
            hoy={esHoy(fecha)}
          />
        </tr>
      </thead>
      <tbody>
        {empleados.map((empleado) => {
          const celda = resolverCelda(fecha, empleado.id, eventos, feriados);

          return (
            <tr key={empleado.id} className="group bg-white hover:bg-row-hover">
              <td
                className={`sticky left-0 z-10 border border-gray-300 bg-white pl-8 pr-4 py-2 font-semibold text-gray-700 group-hover:bg-row-hover ${getLobBorderClass(empleado.lob)}`}
              >
                {empleado.nombre}
              </td>
              <td
                className={`border border-gray-300 px-2 py-1 align-top group-hover:bg-row-hover ${
                  celda.evento
                    ? CELDA_BG_CLASSES[celda.evento.variant]
                    : celda.cerrado
                      ? "bg-feriado-bg"
                      : ""
                }`}
              >
                <CeldaCalendario
                  celda={celda}
                  onClick={
                    isStaff
                      ? () => onDiaClick?.(empleado.id, fecha)
                      : undefined
                  }
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </GridTable>
  );
}
