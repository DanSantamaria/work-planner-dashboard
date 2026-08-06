"use client";

import { getDiasDelMes } from "@/lib/date-utils";
import { resolverCelda } from "@/lib/calendario-celda";
import type { EventoCalendario, FeriadoCalendario } from "@/lib/calendario-celda";
import { getLobColorClass } from "@/lib/lob-color";
import CeldaCalendario from "@/components/calendario/CeldaCalendario";

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
      <div className="overflow-x-auto overflow-y-hidden rounded-2xl">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 w-36 border border-gray-300 bg-table-header px-3 py-2 text-left text-gray-800">
                Nombre
              </th>
              {dias.map((dia) => (
                <th
                  key={dia.toISOString()}
                  className={`w-9 border border-gray-300 bg-table-header px-1 py-2 text-center text-gray-800 ${
                    esHoy(dia) ? "border-t-4 border-t-sidebar" : ""
                  }`}
                >
                  {dia.getDate()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {empleados.map((empleado) => (
              <tr key={empleado.id} className="bg-white">
                <td
                  className={`sticky left-0 z-10 border border-gray-300 px-3 py-1 font-semibold text-gray-700 ${getLobColorClass(empleado.lob)}`}
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
                      className={`border border-gray-300 p-0.5 text-center align-middle ${
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
        </table>
      </div>
    </div>
  );
}
