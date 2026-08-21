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

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold text-gray-800">
        {NOMBRES_MES[fecha.getMonth()]} {fecha.getFullYear()}
      </h2>
      <GridTable textoClase="text-xs">
        <thead>
          <tr>
            <NombreHeaderCell
              anchoClase="w-44"
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
                anchoClase="w-9"
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
                    className={`border border-gray-300 p-0.5 text-center align-middle group-hover:bg-row-hover ${
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
    </div>
  );
}
