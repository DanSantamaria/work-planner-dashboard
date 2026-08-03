"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { LOB, Turno } from "@/generated/prisma/browser";
import { Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { useBusqueda } from "@/context/BusquedaContext";
import { ordenarEmpleados, agruparPorGrupo } from "@/lib/orden-empleados";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import {
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/Table";

const LOB_OPTIONS = Object.values(LOB);
const TURNO_OPTIONS = Object.values(Turno);

type Grupo = { id: string; nombre: string; orden: number };

type Empleado = {
  id: string;
  nombre: string;
  lob: LOB;
  turno: Turno;
  horario: string;
  activo: boolean;
  grupoId: string | null;
  ordenEnGrupo: number;
  grupo: { id: string; nombre: string; orden: number } | null;
};

type Props = {
  initialEmpleados: Empleado[];
  initialGrupos: Grupo[];
};

export default function EmpleadosTable({
  initialEmpleados,
  initialGrupos,
}: Props) {
  const { busqueda } = useBusqueda();
  const [empleados, setEmpleados] = useState<Empleado[]>(initialEmpleados);
  const [gruposDisponibles, setGruposDisponibles] =
    useState<Grupo[]>(initialGrupos);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [newNombre, setNewNombre] = useState("");
  const [newLob, setNewLob] = useState<LOB>(LOB_OPTIONS[0]);
  const [newTurno, setNewTurno] = useState<Turno>(TURNO_OPTIONS[0]);
  const [newHorario, setNewHorario] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editLob, setEditLob] = useState<LOB>(LOB_OPTIONS[0]);
  const [editHorario, setEditHorario] = useState("");

  const [showGrupoForm, setShowGrupoForm] = useState(false);
  const [newGrupoNombre, setNewGrupoNombre] = useState("");
  const [creatingGrupo, setCreatingGrupo] = useState(false);

  function actualizarEmpleadoLocal(id: string, datos: Partial<Empleado>) {
    setEmpleados((prev) =>
      prev.map((emp) => (emp.id === id ? { ...emp, ...datos } : emp))
    );
  }

  async function handleAddEmpleado(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/empleados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: newNombre,
        lob: newLob,
        turno: newTurno,
        horario: newHorario,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Error al crear el empleado");
      return;
    }

    setEmpleados((prev) => [...prev, { ...data, grupo: null }]);
    setNewNombre("");
    setNewLob(LOB_OPTIONS[0]);
    setNewTurno(TURNO_OPTIONS[0]);
    setNewHorario("");
    setShowForm(false);
  }

  function startEditing(empleado: Empleado) {
    setError(null);
    setEditingId(empleado.id);
    setEditNombre(empleado.nombre);
    setEditLob(empleado.lob);
    setEditHorario(empleado.horario);
  }

  function cancelEditing() {
    setEditingId(null);
  }

  async function handleSaveEdit(id: string) {
    setError(null);
    setSubmitting(true);

    const res = await fetch(`/api/empleados/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: editNombre,
        lob: editLob,
        horario: editHorario,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Error al actualizar el empleado");
      return;
    }

    actualizarEmpleadoLocal(id, data);
    setEditingId(null);
  }

  async function handleDelete(empleado: Empleado) {
    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar a "${empleado.nombre}"?`
    );
    if (!confirmed) return;

    setError(null);

    const res = await fetch(`/api/empleados/${empleado.id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Error al eliminar el empleado");
      return;
    }

    actualizarEmpleadoLocal(empleado.id, data);
  }

  async function handleReactivar(empleado: Empleado) {
    setError(null);

    const res = await fetch(`/api/empleados/${empleado.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: true }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Error al reactivar el empleado");
      return;
    }

    actualizarEmpleadoLocal(empleado.id, data);
  }

  async function handleGrupoChange(empleado: Empleado, nuevoGrupoId: string) {
    setError(null);
    const grupoIdFinal = nuevoGrupoId || null;

    const empleadosDelGrupoDestino = empleados.filter(
      (e) => e.grupoId === grupoIdFinal && e.id !== empleado.id
    );
    const maxOrden = empleadosDelGrupoDestino.reduce(
      (max, e) => Math.max(max, e.ordenEnGrupo),
      -1
    );
    const nuevoOrden = maxOrden + 1;

    const res = await fetch(`/api/empleados/${empleado.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grupoId: grupoIdFinal, ordenEnGrupo: nuevoOrden }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "No se pudo actualizar el grupo");
      return;
    }

    const grupoEncontrado =
      gruposDisponibles.find((g) => g.id === grupoIdFinal) ?? null;
    actualizarEmpleadoLocal(empleado.id, {
      grupoId: grupoIdFinal,
      ordenEnGrupo: nuevoOrden,
      grupo: grupoEncontrado,
    });
  }

  // Ties (everyone starts at ordenEnGrupo 0) mean a plain value-swap between
  // two tied rows would visibly do nothing on the first click. Reassigning
  // the whole group to 0..N-1 in the new order guarantees the move always
  // works, and permanently resolves ties within that group afterward.
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

  async function handleAddGrupo(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setCreatingGrupo(true);

    const res = await fetch("/api/grupos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: newGrupoNombre }),
    });

    const data = await res.json();
    setCreatingGrupo(false);

    if (!res.ok) {
      setError(data.error ?? "No se pudo crear el grupo");
      return;
    }

    setGruposDisponibles((prev) => [...prev, data]);
    setNewGrupoNombre("");
    setShowGrupoForm(false);
  }

  const empleadosFiltrados = empleados.filter((empleado) =>
    empleado.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );
  const grupos = agruparPorGrupo(ordenarEmpleados(empleadosFiltrados));

  // Flattened once so the row-stripe index runs continuously across group
  // boundaries, while indexEnGrupo/grupoEmpleados stay available for the
  // up/down controls (which only care about position within their own group).
  let contadorFila = 0;
  const filas = grupos.flatMap((grupo) =>
    grupo.empleados.map((empleado, indexEnGrupo) => ({
      empleado,
      grupoEmpleados: grupo.empleados,
      indexEnGrupo,
      indexGlobal: contadorFila++,
    }))
  );

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <Button onClick={() => setShowForm((prev) => !prev)} variant="primary">
          {showForm ? "Cancelar" : "+ Nuevo empleado"}
        </Button>
        <Button
          onClick={() => setShowGrupoForm((prev) => !prev)}
          variant="secondary"
        >
          {showGrupoForm ? "Cancelar" : "+ Nuevo grupo"}
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAddEmpleado}
          className="mb-6 flex flex-col sm:flex-row flex-wrap gap-3 bg-white border border-gray-200 rounded-lg p-4"
        >
          <Input
            placeholder="Nombre"
            value={newNombre}
            onChange={(e) => setNewNombre(e.target.value)}
            required
            wrapperClassName="flex-1 min-w-[160px]"
          />

          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-sidebar"
            value={newLob}
            onChange={(e) => setNewLob(e.target.value as LOB)}
          >
            {LOB_OPTIONS.map((lob) => (
              <option key={lob} value={lob}>
                {lob}
              </option>
            ))}
          </select>

          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-sidebar"
            value={newTurno}
            onChange={(e) => setNewTurno(e.target.value as Turno)}
          >
            {TURNO_OPTIONS.map((turno) => (
              <option key={turno} value={turno}>
                {turno}
              </option>
            ))}
          </select>

          <Input
            placeholder='Horario (ej. "07:00 - 15:00")'
            value={newHorario}
            onChange={(e) => setNewHorario(e.target.value)}
            wrapperClassName="flex-1 min-w-[200px]"
          />

          <Button type="submit" variant="success" loading={submitting}>
            {submitting ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      )}

      {showGrupoForm && (
        <form
          onSubmit={handleAddGrupo}
          className="mb-6 flex flex-col sm:flex-row flex-wrap gap-3 bg-white border border-gray-200 rounded-lg p-4"
        >
          <Input
            placeholder='Nombre del grupo (ej. "Grupo 1")'
            value={newGrupoNombre}
            onChange={(e) => setNewGrupoNombre(e.target.value)}
            required
            wrapperClassName="flex-1 min-w-[200px]"
          />
          <Button type="submit" variant="success" loading={creatingGrupo}>
            {creatingGrupo ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      )}

      <Table>
        <TableHead>
          <TableHeaderCell>Nombre</TableHeaderCell>
          <TableHeaderCell>Grupo</TableHeaderCell>
          <TableHeaderCell>LOB</TableHeaderCell>
          <TableHeaderCell>Horario</TableHeaderCell>
          <TableHeaderCell>Estado</TableHeaderCell>
          <TableHeaderCell>Acciones</TableHeaderCell>
        </TableHead>
        <TableBody>
          {filas.map(({ empleado, grupoEmpleados, indexEnGrupo, indexGlobal }) => {
            const isEditing = editingId === empleado.id;

            return (
              <TableRow
                key={empleado.id}
                index={indexGlobal}
                className={!empleado.activo ? "opacity-50" : ""}
              >
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={editNombre}
                        onChange={(e) => setEditNombre(e.target.value)}
                        compact
                      />
                    ) : (
                      <span className="text-gray-800 font-medium">
                        {empleado.nombre}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <div className="flex flex-col">
                        <button
                          type="button"
                          disabled={indexEnGrupo === 0}
                          onClick={() =>
                            moverEmpleado(grupoEmpleados, indexEnGrupo, -1)
                          }
                          className="text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                          aria-label="Subir"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={indexEnGrupo === grupoEmpleados.length - 1}
                          onClick={() =>
                            moverEmpleado(grupoEmpleados, indexEnGrupo, 1)
                          }
                          className="text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                          aria-label="Bajar"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                      <select
                        className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-sidebar"
                        value={empleado.grupoId ?? ""}
                        onChange={(e) =>
                          handleGrupoChange(empleado, e.target.value)
                        }
                      >
                        <option value="">Sin grupo</option>
                        {gruposDisponibles.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <select
                        className="w-full border border-gray-300 rounded px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-sidebar"
                        value={editLob}
                        onChange={(e) => setEditLob(e.target.value as LOB)}
                      >
                        {LOB_OPTIONS.map((lob) => (
                          <option key={lob} value={lob}>
                            {lob}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-gray-600">{empleado.lob}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={editHorario}
                        onChange={(e) => setEditHorario(e.target.value)}
                        compact
                      />
                    ) : (
                      <span className="text-gray-600">
                        {empleado.horario || "—"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={empleado.activo ? "success" : "default"}>
                      {empleado.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSaveEdit(empleado.id)}
                          loading={submitting}
                          className="text-green-600 hover:text-green-700"
                        >
                          Guardar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelEditing}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(empleado)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Editar"
                          aria-label="Editar"
                        >
                          <Pencil size={16} />
                        </Button>
                        {empleado.activo ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(empleado)}
                            className="text-red-500 hover:text-red-600"
                            title="Eliminar"
                            aria-label="Eliminar"
                          >
                            <Trash2 size={16} />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReactivar(empleado)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            Reactivar
                          </Button>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </div>
  );
}
