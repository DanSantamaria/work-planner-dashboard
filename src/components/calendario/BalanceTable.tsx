"use client";

import { Fragment, useState } from "react";
import { useBusqueda } from "@/context/BusquedaContext";
import { agruparPorGrupo } from "@/lib/orden-empleados";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/Table";

type Empleado = {
  id: string;
  nombre: string;
  lob: string;
  horario: string;
  grupoId: string | null;
  ordenEnGrupo: number;
  grupo?: { orden: number; nombre: string } | null;
  diasVacaciones: number;
  diasVacacionesUsados: number;
  horasExceso: number;
  horasExcesoUsadas: number;
  horasMedicasTotal: number;
  horasMedicasUsadas: number;
};

type CampoTotal = "diasVacaciones" | "horasExceso" | "horasMedicasTotal";

type Props = {
  initialEmpleados: Empleado[];
  isStaff: boolean;
};

// Which cell (employee + total field) is currently open for editing —
// only one at a time, same idea as EmpleadosTable's editingId.
type EdicionActiva = {
  empleadoId: string;
  campo: CampoTotal;
} | null;

function BalanceCelda({
  total,
  usado,
  editable,
  editando,
  valorEdicion,
  guardando,
  onEmpezarEdicion,
  onCambiarValor,
  onGuardar,
  onCancelar,
}: {
  total: number;
  usado: number;
  editable: boolean;
  editando: boolean;
  valorEdicion: string;
  guardando: boolean;
  onEmpezarEdicion: () => void;
  onCambiarValor: (valor: string) => void;
  onGuardar: () => void;
  onCancelar: () => void;
}) {
  const restante = total - usado;

  if (editando) {
    return (
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          value={valorEdicion}
          onChange={(e) => onCambiarValor(e.target.value)}
          compact
          className="w-16"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={onGuardar}
          loading={guardando}
          className="text-green-600 hover:text-green-700"
        >
          Guardar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancelar}
          className="text-gray-500 hover:text-gray-700"
        >
          Cancelar
        </Button>
      </div>
    );
  }

  return (
    <span className="text-gray-700">
      {restante} /{" "}
      {editable ? (
        <button
          type="button"
          onClick={onEmpezarEdicion}
          title="Editar total"
          className="underline decoration-dotted underline-offset-2 hover:text-sidebar cursor-pointer"
        >
          {total}
        </button>
      ) : (
        total
      )}
    </span>
  );
}

export default function BalanceTable({ initialEmpleados, isStaff }: Props) {
  const { busqueda } = useBusqueda();
  const [empleados, setEmpleados] = useState<Empleado[]>(initialEmpleados);
  const [edicion, setEdicion] = useState<EdicionActiva>(null);
  const [valorEdicion, setValorEdicion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function empezarEdicion(empleadoId: string, campo: CampoTotal, valorActual: number) {
    setError(null);
    setEdicion({ empleadoId, campo });
    setValorEdicion(String(valorActual));
  }

  function cancelarEdicion() {
    setEdicion(null);
  }

  async function guardarEdicion() {
    if (!edicion) return;

    const valor = Number(valorEdicion);
    if (isNaN(valor) || valor < 0) {
      setError("El valor debe ser un número mayor o igual a cero");
      return;
    }

    setError(null);
    setGuardando(true);

    const res = await fetch(`/api/empleados/${edicion.empleadoId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [edicion.campo]: valor }),
    });

    const data = await res.json();
    setGuardando(false);

    if (!res.ok) {
      setError(data.error ?? "No se pudo guardar el cambio");
      return;
    }

    setEmpleados((prev) =>
      prev.map((emp) => (emp.id === edicion.empleadoId ? { ...emp, ...data } : emp))
    );
    setEdicion(null);
  }

  const empleadosFiltrados = empleados.filter((empleado) =>
    empleado.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );
  const grupos = agruparPorGrupo(empleadosFiltrados);

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
          {error}
        </div>
      )}

      <Table>
        <TableHead>
          <TableHeaderCell className="w-12">#</TableHeaderCell>
          <TableHeaderCell>Empleado</TableHeaderCell>
          <TableHeaderCell>Vacaciones (días)</TableHeaderCell>
          <TableHeaderCell>Horas exceso</TableHeaderCell>
          <TableHeaderCell>Horas médicas</TableHeaderCell>
        </TableHead>
        <TableBody>
          {grupos.map((grupo) => (
            <Fragment key={grupo.grupoId ?? "sin-grupo"}>
              <tr className="bg-sidebar text-white">
                <TableCell colSpan={5} className="font-bold border-gray-300">
                  {grupo.nombreGrupo}
                </TableCell>
              </tr>
              {grupo.empleados.map((empleado, index) => (
                <TableRow key={empleado.id} index={index}>
                  <TableCell className="text-gray-500">{index + 1}</TableCell>
                  <TableCell>
                    <span className="text-gray-800 font-medium">
                      {empleado.nombre}
                    </span>
                  </TableCell>
                  <TableCell>
                    <BalanceCelda
                      total={empleado.diasVacaciones}
                      usado={empleado.diasVacacionesUsados}
                      editable={isStaff}
                      editando={
                        edicion?.empleadoId === empleado.id &&
                        edicion.campo === "diasVacaciones"
                      }
                      valorEdicion={valorEdicion}
                      guardando={guardando}
                      onEmpezarEdicion={() =>
                        empezarEdicion(
                          empleado.id,
                          "diasVacaciones",
                          empleado.diasVacaciones
                        )
                      }
                      onCambiarValor={setValorEdicion}
                      onGuardar={guardarEdicion}
                      onCancelar={cancelarEdicion}
                    />
                  </TableCell>
                  <TableCell>
                    <BalanceCelda
                      total={empleado.horasExceso}
                      usado={empleado.horasExcesoUsadas}
                      editable={isStaff}
                      editando={
                        edicion?.empleadoId === empleado.id &&
                        edicion.campo === "horasExceso"
                      }
                      valorEdicion={valorEdicion}
                      guardando={guardando}
                      onEmpezarEdicion={() =>
                        empezarEdicion(
                          empleado.id,
                          "horasExceso",
                          empleado.horasExceso
                        )
                      }
                      onCambiarValor={setValorEdicion}
                      onGuardar={guardarEdicion}
                      onCancelar={cancelarEdicion}
                    />
                  </TableCell>
                  <TableCell>
                    <BalanceCelda
                      total={empleado.horasMedicasTotal}
                      usado={empleado.horasMedicasUsadas}
                      editable={isStaff}
                      editando={
                        edicion?.empleadoId === empleado.id &&
                        edicion.campo === "horasMedicasTotal"
                      }
                      valorEdicion={valorEdicion}
                      guardando={guardando}
                      onEmpezarEdicion={() =>
                        empezarEdicion(
                          empleado.id,
                          "horasMedicasTotal",
                          empleado.horasMedicasTotal
                        )
                      }
                      onCambiarValor={setValorEdicion}
                      onGuardar={guardarEdicion}
                      onCancelar={cancelarEdicion}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
