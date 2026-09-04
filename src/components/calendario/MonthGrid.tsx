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
  //
  // min-w-full puts a floor under that. The columns only add up to a fixed
  // ~1540px (a w-44 name column plus 31 w-11 days), so on a wide enough
  // screen w-auto alone leaves the table short of the container while the
  // toolbar and the Grupos y Totales table — both w-full — run past its
  // right edge. The floor makes the table fill the container whenever it
  // would otherwise come up short, distributing the slack across the day
  // columns, so all three line up at both edges. Below that width the
  // natural width still wins and the scroll behaves exactly as before.
  return (
    <GridTable textoClase="text-xs" anchoClase="w-auto min-w-full">
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
                  className={`relative border border-gray-300 p-1.5 text-center align-middle group-hover:bg-row-hover ${
                    celda.cerrado ? "bg-feriado-bg" : ""
                  }`}
                >
                  <CeldaCalendario
                    celda={celda}
                    isStaff={isStaff}
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
