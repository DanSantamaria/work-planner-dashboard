"use client";

import { getDiasDelMes } from "@/lib/date-utils";
import { resolverCelda } from "@/lib/calendario-celda";
import type { EventoCalendario, FeriadoCalendario } from "@/lib/calendario-celda";
import { getLobBorderClass } from "@/lib/lob-color";
import CeldaCalendario from "@/components/calendario/CeldaCalendario";
import {
  GridTable,
  NombreHeaderCell,
  DiaHeaderCell,
} from "@/components/ui/GridTable";

function esHoy(date: Date): boolean {
  return date.toDateString() === new Date().toDateString();
}

type Empleado = { id: string; nombre: string; lob: string };

type Props = {
  fecha: Date; // any date within the desired month
  empleados: Empleado[];
  eventos: EventoCalendario[];
  feriados: FeriadoCalendario[];
  isStaff: boolean;
  onDiaClick?: (empleadoId: string, fecha: Date) => void;
};

export default function MonthGrid({
  fecha,
  empleados,
  eventos,
  feriados,
  isStaff,
  onDiaClick,
}: Props) {
  const dias = getDiasDelMes(fecha);

  // No month/year heading here: the toolbar's ← → label already says which
  // month is on screen, and repeating it just pushed the grid down.
  //
  // w-auto: with 31 day columns a w-full table divides the container between
  // them and squashes every cell flat. Letting the table take the width its
  // columns ask for keeps them square-ish and moves the excess into the
  // horizontal scroll, which is the trade being made here.
  return (
    <GridTable textoClase="text-xs" anchoClase="w-auto">
      <thead>
        <tr>
          <NombreHeaderCell
            anchoClase="w-28 md:w-44"
            paddingClase="px-3 py-2"
            textoClase=""
          >
            Nombre
          </NombreHeaderCell>
          {dias.map((dia) => (
            <DiaHeaderCell
              key={dia.toISOString()}
              numero={dia.getDate()}
              hoy={esHoy(dia)}
              anchoClase="w-11"
              paddingClase="px-1 py-2"
            />
          ))}
        </tr>
      </thead>
      <tbody>
        {empleados.map((empleado) => (
          <tr key={empleado.id} className="group bg-white hover:bg-row-hover">
            <td
              className={`sticky left-0 z-10 border border-gray-300 bg-white pl-7 pr-3 py-1 font-semibold text-gray-700 group-hover:bg-row-hover ${getLobBorderClass(empleado.lob)}`}
            >
              {empleado.nombre}
            </td>
            {dias.map((dia) => {
              const celda = resolverCelda(
                dia,
                empleado.id,
                eventos,
                feriados
              );

              return (
                <td
                  key={dia.toISOString()}
                  className={`border border-gray-300 p-1.5 text-center align-middle group-hover:bg-row-hover ${
                    celda.cerrado ? "bg-feriado-bg" : ""
                  }`}
                >
                  <CeldaCalendario
                    celda={celda}
                    onClick={
                      isStaff
                        ? () => onDiaClick?.(empleado.id, dia)
                        : undefined
                    }
                    compact
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
