"use client";

import { Fragment, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useBusqueda } from "@/context/BusquedaContext";
import { agruparPorGrupo, ordenarEmpleados } from "@/lib/orden-empleados";
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

export type Empleado = {
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
type CampoUsado =
  | "diasVacacionesUsados"
  | "horasExcesoUsadas"
  | "horasMedicasUsadas";

// The DB keeps two numbers per concept (yearly total + consumed), but the
// table only ever shows and edits their difference — the balance left today,
// which is the only figure that means anything mid-year. Editing therefore
// translates: what you type is the balance you want, what gets saved is the
// total that makes the subtraction come out to it. This map is how the cell
// finds the "consumed" counterpart of the total it is editing.
const CAMPO_USADO: Record<CampoTotal, CampoUsado> = {
  diasVacaciones: "diasVacacionesUsados",
  horasExceso: "horasExcesoUsadas",
  horasMedicasTotal: "horasMedicasUsadas",
};

type Props = {
  // Named "servidor" rather than "initial": it is not just a seed value —
  // every time the page's server component re-runs (router.refresh() after
  // saving an event), a fresh array arrives here and the table syncs to it.
  empleadosServidor: Empleado[];
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
  const saldo = total - usado;

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

  if (!editable) {
    return <span className="text-gray-700">{saldo}</span>;
  }

  return (
    <button
      type="button"
      onClick={onEmpezarEdicion}
      title="Editar saldo"
      className="cursor-pointer text-gray-700 underline decoration-dotted underline-offset-2 hover:text-sidebar"
    >
      {saldo}
    </button>
  );
}

export default function BalanceTable({ empleadosServidor, isStaff }: Props) {
  const { busqueda } = useBusqueda();
  const [empleados, setEmpleados] = useState<Empleado[]>(empleadosServidor);
  const [servidorPrevio, setServidorPrevio] = useState(empleadosServidor);

  // Local state exists so edits and reorders show up instantly, but it would
  // otherwise stay frozen at whatever mount captured — which is why balances
  // used to need a page reload to reflect a new evento. React's documented
  // "adjust state while rendering" pattern (rather than a useEffect, which
  // would render twice and flash the stale number) resyncs whenever a new
  // array arrives. Identity only changes when the server sends fresh data:
  // RSC payloads stay stable across client re-renders, so this never fights
  // the in-place updates below — by then the server data already has them.
  if (empleadosServidor !== servidorPrevio) {
    setServidorPrevio(empleadosServidor);
    setEmpleados(empleadosServidor);
  }
  const [edicion, setEdicion] = useState<EdicionActiva>(null);
  const [valorEdicion, setValorEdicion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function empezarEdicion(empleadoId: string, campo: CampoTotal, saldoActual: number) {
    setError(null);
    setEdicion({ empleadoId, campo });
    setValorEdicion(String(saldoActual));
  }

  function cancelarEdicion() {
    setEdicion(null);
  }

  async function guardarEdicion() {
    if (!edicion) return;

    const saldo = Number(valorEdicion);
    if (isNaN(saldo) || saldo < 0) {
      setError("El valor debe ser un número mayor o igual a cero");
      return;
    }

    const empleado = empleados.find((emp) => emp.id === edicion.empleadoId);
    if (!empleado) {
      setError("No se encontró el empleado");
      return;
    }

    // The typed number is a balance, the column stores a yearly total, so
    // add back whatever events have already consumed. total - usado then
    // renders exactly the number that was typed.
    const usado = empleado[CAMPO_USADO[edicion.campo]];
    const totalNuevo = saldo + usado;

    setError(null);
    setGuardando(true);

    const res = await fetch(`/api/empleados/${edicion.empleadoId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [edicion.campo]: totalNuevo }),
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

  // Ties (everyone starts at ordenEnGrupo 0) mean a plain value-swap
  // between two tied rows would visibly do nothing on the first click.
  // Reassigning the whole group to 0..N-1 in the new order guarantees the
  // move always works, and permanently resolves ties within that group.
  async function moverEmpleado(
    empleadosDelGrupo: Empleado[],
    index: number,
    direccion: -1 | 1
  ) {
    const otroIndex = index + direccion;
    if (otroIndex < 0 || otroIndex >= empleadosDelGrupo.length) return;

    const reordenado = [...empleadosDelGrupo];
    [reordenado[index], reordenado[otroIndex]] = [
      reordenado[otroIndex],
      reordenado[index],
    ];

    setError(null);

    const resultados = await Promise.all(
      reordenado.map(async (empleado, i) => {
        const res = await fetch(`/api/empleados/${empleado.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ordenEnGrupo: i }),
        });
        return { id: empleado.id, ordenEnGrupo: i, ok: res.ok };
      })
    );

    if (resultados.some((r) => !r.ok)) {
      setError("No se pudo reordenar");
      return;
    }

    setEmpleados((prev) =>
      prev.map((emp) => {
        const actualizado = resultados.find((r) => r.id === emp.id);
        return actualizado
          ? { ...emp, ordenEnGrupo: actualizado.ordenEnGrupo }
          : emp;
      })
    );
  }

  const empleadosFiltrados = empleados.filter((empleado) =>
    empleado.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );
  // agruparPorGrupo needs its input pre-sorted by ordenEnGrupo — after a
  // reorder, setEmpleados only updates each employee's ordenEnGrupo value
  // in place, not their position in the array, so re-sorting here is what
  // actually makes the new order show up (and keeps the up/down buttons'
  // index math correct) without a full page reload.
  const grupos = agruparPorGrupo(ordenarEmpleados(empleadosFiltrados));

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
          {error}
        </div>
      )}

      <Table>
        <TableHead sticky={false}>
          {isStaff && <TableHeaderCell className="w-16" />}
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
                <TableCell
                  colSpan={isStaff ? 6 : 5}
                  className="font-bold border-gray-300"
                >
                  {grupo.nombreGrupo}
                </TableCell>
              </tr>
              {grupo.empleados.map((empleado, index) => (
                <TableRow key={empleado.id} index={index}>
                  {isStaff && (
                    <TableCell>
                      {/* The icons stay 14px so the desktop table looks the
                          same; the padding is what a finger actually aims at
                          (~44px for the pair). */}
                      <div className="flex flex-col">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() =>
                            moverEmpleado(grupo.empleados, index, -1)
                          }
                          className="cursor-pointer px-2 py-1 text-gray-400 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-20"
                          aria-label="Subir"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={index === grupo.empleados.length - 1}
                          onClick={() =>
                            moverEmpleado(grupo.empleados, index, 1)
                          }
                          className="cursor-pointer px-2 py-1 text-gray-400 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-20"
                          aria-label="Bajar"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    </TableCell>
                  )}
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
                          empleado.diasVacaciones - empleado.diasVacacionesUsados
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
                          empleado.horasExceso - empleado.horasExcesoUsadas
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
                          empleado.horasMedicasTotal - empleado.horasMedicasUsadas
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
