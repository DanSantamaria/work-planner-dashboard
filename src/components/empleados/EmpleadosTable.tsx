"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { LOB, Turno } from "@/generated/prisma/browser";

const LOB_OPTIONS = Object.values(LOB);
const TURNO_OPTIONS = Object.values(Turno);

type Empleado = {
  id: string;
  nombre: string;
  lob: LOB;
  turno: Turno;
  horario: string;
  activo: boolean;
};

type Props = {
  initialEmpleados: Empleado[];
};

function sortByNombre(empleados: Empleado[]) {
  return [...empleados].sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export default function EmpleadosTable({ initialEmpleados }: Props) {
  const [empleados, setEmpleados] = useState<Empleado[]>(
    sortByNombre(initialEmpleados)
  );
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

    setEmpleados((prev) => sortByNombre([...prev, data]));
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

    setEmpleados((prev) =>
      sortByNombre(prev.map((emp) => (emp.id === id ? data : emp)))
    );
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

    setEmpleados((prev) =>
      prev.map((emp) => (emp.id === empleado.id ? data : emp))
    );
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

    setEmpleados((prev) =>
      prev.map((emp) => (emp.id === empleado.id ? data : emp))
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="mb-4">
        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer"
        >
          {showForm ? "Cancelar" : "+ Nuevo empleado"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAddEmpleado}
          className="mb-6 flex flex-col sm:flex-row flex-wrap gap-3 bg-white border border-gray-200 rounded-lg p-4"
        >
          <input
            className="flex-1 min-w-[160px] border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400"
            placeholder="Nombre"
            value={newNombre}
            onChange={(e) => setNewNombre(e.target.value)}
            required
          />

          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700"
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
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700"
            value={newTurno}
            onChange={(e) => setNewTurno(e.target.value as Turno)}
          >
            {TURNO_OPTIONS.map((turno) => (
              <option key={turno} value={turno}>
                {turno}
              </option>
            ))}
          </select>

          <input
            className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400"
            placeholder='Horario (ej. "07:00 - 15:00")'
            value={newHorario}
            onChange={(e) => setNewHorario(e.target.value)}
          />

          <button
            type="submit"
            disabled={submitting}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer"
          >
            {submitting ? "Guardando..." : "Guardar"}
          </button>
        </form>
      )}

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="border border-blue-500 px-4 py-3 text-left">
                Nombre
              </th>
              <th className="border border-blue-500 px-4 py-3 text-left">
                LOB
              </th>
              <th className="border border-blue-500 px-4 py-3 text-left">
                Horario
              </th>
              <th className="border border-blue-500 px-4 py-3 text-left">
                Estado
              </th>
              <th className="border border-blue-500 px-4 py-3 text-left">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {empleados.map((empleado, index) => {
              const rowBg = index % 2 === 0 ? "bg-white" : "bg-gray-50";
              const isEditing = editingId === empleado.id;

              return (
                <tr
                  key={empleado.id}
                  className={`${rowBg} ${!empleado.activo ? "opacity-50" : ""}`}
                >
                  <td className="border border-gray-200 px-4 py-2">
                    {isEditing ? (
                      <input
                        className="w-full border border-gray-300 rounded px-2 py-1 text-gray-700"
                        value={editNombre}
                        onChange={(e) => setEditNombre(e.target.value)}
                      />
                    ) : (
                      <span className="text-gray-800 font-medium">
                        {empleado.nombre}
                      </span>
                    )}
                  </td>
                  <td className="border border-gray-200 px-4 py-2">
                    {isEditing ? (
                      <select
                        className="w-full border border-gray-300 rounded px-2 py-1 text-gray-700"
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
                  </td>
                  <td className="border border-gray-200 px-4 py-2">
                    {isEditing ? (
                      <input
                        className="w-full border border-gray-300 rounded px-2 py-1 text-gray-700"
                        value={editHorario}
                        onChange={(e) => setEditHorario(e.target.value)}
                      />
                    ) : (
                      <span className="text-gray-600">
                        {empleado.horario || "—"}
                      </span>
                    )}
                  </td>
                  <td className="border border-gray-200 px-4 py-2">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        empleado.activo
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {empleado.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="border border-gray-200 px-4 py-2">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(empleado.id)}
                          disabled={submitting}
                          className="text-green-600 hover:text-green-700 text-xs font-medium cursor-pointer disabled:opacity-50"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="text-gray-500 hover:text-gray-700 text-xs font-medium cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <button
                          onClick={() => startEditing(empleado)}
                          className="text-blue-600 hover:text-blue-700 text-xs font-medium cursor-pointer"
                        >
                          Editar
                        </button>
                        {empleado.activo ? (
                          <button
                            onClick={() => handleDelete(empleado)}
                            className="text-red-500 hover:text-red-600 text-xs font-medium cursor-pointer"
                          >
                            Eliminar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivar(empleado)}
                            className="text-gray-500 hover:text-gray-700 text-xs font-medium cursor-pointer"
                          >
                            Reactivar
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
