"use client";

import { resolverCelda } from "@/lib/calendario-celda";
import type { EventoCalendario, FeriadoCalendario } from "@/lib/calendario-celda";
import { getLobColorClass } from "@/lib/lob-color";
import CeldaCalendario from "@/components/calendario/CeldaCalendario";
import {
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/Table";

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
    <Table>
      <TableHead>
        <TableHeaderCell>Empleado</TableHeaderCell>
        <TableHeaderCell>Estado</TableHeaderCell>
      </TableHead>
      <TableBody>
        {empleados.map((empleado, index) => {
          const celda = resolverCelda(fecha, empleado.id, eventos, feriados);

          return (
            <TableRow key={empleado.id} index={index}>
              <TableCell className={getLobColorClass(empleado.lob)}>
                <span className="text-gray-800 font-medium">
                  {empleado.nombre}
                </span>
              </TableCell>
              <TableCell className={celda.cerrado ? "bg-feriado-bg" : ""}>
                <CeldaCalendario
                  celda={celda}
                  onClick={
                    isStaff
                      ? () => onDiaClick?.(empleado.id, fecha)
                      : undefined
                  }
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
