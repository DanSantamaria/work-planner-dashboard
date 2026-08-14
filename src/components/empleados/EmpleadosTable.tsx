"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { LOB, Turno } from "@/generated/prisma/browser";
import { Pencil, Trash2 } from "lucide-react";
import { useBusqueda } from "@/context/BusquedaContext";
import { ordenarEmpleadosFlat } from "@/lib/orden-empleados";
import { getLobLabel } from "@/lib/lob-color";
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

  const [editingGrupoId, setEditingGrupoId] = useState<string | null>(null);
  const [editGrupoNombre, setEditGrupoNombre] = useState("");
  const [savingGrupoEdit, setSavingGrupoEdit] = useState(false);

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

  async function handleAddGrupo(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setCreatingGrupo(true);

    // Every group created via this form previously defaulted to the same
    // orden (0), which broke "Grupos y Totales" — groups with a tied
    // orden aren't guaranteed to stay contiguous once sorted. Assigning
    // the next free slot here keeps new groups distinct going forward.
    const siguienteOrden =
      Math.max(-1, ...gruposDisponibles.map((g) => g.orden)) + 1;

    const res = await fetch("/api/grupos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: newGrupoNombre, orden: siguienteOrden }),
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

  function startEditingGrupo(grupo: Grupo) {
    setError(null);
    setEditingGrupoId(grupo.id);
    setEditGrupoNombre(grupo.nombre);
  }

  function cancelEditingGrupo() {
    setEditingGrupoId(null);
  }

  async function handleSaveGrupoEdit(id: string) {
    setError(null);
    setSavingGrupoEdit(true);

    const res = await fetch(`/api/grupos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: editGrupoNombre }),
    });

    const data = await res.json();
    setSavingGrupoEdit(false);

    if (!res.ok) {
      setError(data.error ?? "No se pudo actualizar el grupo");
      return;
    }

    setGruposDisponibles((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...data } : g))
    );
    setEditingGrupoId(null);
  }

  const empleadosFiltrados = empleados.filter((empleado) =>
    empleado.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );
  // Flat by shift/LOB/name — Grupo assignment doesn't affect this page's
  // row order, only the "Grupos y Totales" balance table's.
  const filas = ordenarEmpleadosFlat(empleadosFiltrados).map(
    (empleado, indexGlobal) => ({ empleado, indexGlobal })
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
                {getLobLabel(lob)}
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

      {gruposDisponibles.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {gruposDisponibles.map((grupo) => (
            <div
              key={grupo.id}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5"
            >
              {editingGrupoId === grupo.id ? (
                <>
                  <Input
                    value={editGrupoNombre}
                    onChange={(e) => setEditGrupoNombre(e.target.value)}
                    compact
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSaveGrupoEdit(grupo.id)}
                    loading={savingGrupoEdit}
                    className="text-green-600 hover:text-green-700"
                  >
                    Guardar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={cancelEditingGrupo}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Cancelar
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-sm text-gray-700">{grupo.nombre}</span>
                  <button
                    type="button"
                    onClick={() => startEditingGrupo(grupo)}
                    className="cursor-pointer text-blue-600 hover:text-blue-700"
                    title="Editar"
                    aria-label="Editar"
                  >
                    <Pencil size={14} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
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
          {filas.map(({ empleado, indexGlobal }) => {
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
                            {getLobLabel(lob)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-gray-600">
                        {getLobLabel(empleado.lob)}
                      </span>
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
