"use client";

import { useState } from "react";
import type { FormEvent } from "react";

type Tarea = {
  id: string;
  nombre: string;
  descripcion: string | null;
  activa: boolean;
};

type Props = {
  initialTareas: Tarea[];
};

function sortByNombre(tareas: Tarea[]) {
  return [...tareas].sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export default function TareasTable({ initialTareas }: Props) {
  const [tareas, setTareas] = useState<Tarea[]>(sortByNombre(initialTareas));
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [newNombre, setNewNombre] = useState("");
  const [newDescripcion, setNewDescripcion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");

  async function handleAddTarea(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/tareas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: newNombre,
        descripcion: newDescripcion,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Error al crear la tarea");
      return;
    }

    setTareas((prev) => sortByNombre([...prev, data]));
    setNewNombre("");
    setNewDescripcion("");
    setShowForm(false);
  }

  function startEditing(tarea: Tarea) {
    setError(null);
    setEditingId(tarea.id);
    setEditNombre(tarea.nombre);
    setEditDescripcion(tarea.descripcion ?? "");
  }

  function cancelEditing() {
    setEditingId(null);
  }

  async function handleSaveEdit(id: string) {
    setError(null);
    setSubmitting(true);

    const res = await fetch(`/api/tareas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: editNombre,
        descripcion: editDescripcion,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Error al actualizar la tarea");
      return;
    }

    setTareas((prev) =>
      sortByNombre(prev.map((t) => (t.id === id ? data : t)))
    );
    setEditingId(null);
  }

  async function handleDelete(tarea: Tarea) {
    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar la tarea "${tarea.nombre}"?`
    );
    if (!confirmed) return;

    setError(null);

    const res = await fetch(`/api/tareas/${tarea.id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Error al eliminar la tarea");
      return;
    }

    setTareas((prev) => prev.map((t) => (t.id === tarea.id ? data : t)));
  }

  async function handleReactivar(tarea: Tarea) {
    setError(null);

    const res = await fetch(`/api/tareas/${tarea.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activa: true }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Error al reactivar la tarea");
      return;
    }

    setTareas((prev) => prev.map((t) => (t.id === tarea.id ? data : t)));
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
          {showForm ? "Cancelar" : "+ Nueva tarea"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAddTarea}
          className="mb-6 flex flex-col sm:flex-row gap-3 bg-white border border-gray-200 rounded-lg p-4"
        >
          <input
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400"
            placeholder="Nombre de la tarea"
            value={newNombre}
            onChange={(e) => setNewNombre(e.target.value)}
            required
          />
          <input
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400"
            placeholder="Descripción (opcional)"
            value={newDescripcion}
            onChange={(e) => setNewDescripcion(e.target.value)}
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
                Descripción
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
            {tareas.map((tarea, index) => {
              const rowBg = index % 2 === 0 ? "bg-white" : "bg-gray-50";
              const isEditing = editingId === tarea.id;

              return (
                <tr key={tarea.id} className={rowBg}>
                  <td className="border border-gray-200 px-4 py-2">
                    {isEditing ? (
                      <input
                        className="w-full border border-gray-300 rounded px-2 py-1 text-gray-700"
                        value={editNombre}
                        onChange={(e) => setEditNombre(e.target.value)}
                      />
                    ) : (
                      <span className="text-gray-800 font-medium">
                        {tarea.nombre}
                      </span>
                    )}
                  </td>
                  <td className="border border-gray-200 px-4 py-2">
                    {isEditing ? (
                      <input
                        className="w-full border border-gray-300 rounded px-2 py-1 text-gray-700"
                        value={editDescripcion}
                        onChange={(e) => setEditDescripcion(e.target.value)}
                      />
                    ) : (
                      <span className="text-gray-600">
                        {tarea.descripcion || "—"}
                      </span>
                    )}
                  </td>
                  <td className="border border-gray-200 px-4 py-2">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        tarea.activa
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {tarea.activa ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="border border-gray-200 px-4 py-2">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(tarea.id)}
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
                          onClick={() => startEditing(tarea)}
                          className="text-blue-600 hover:text-blue-700 text-xs font-medium cursor-pointer"
                        >
                          Editar
                        </button>
                        {tarea.activa ? (
                          <button
                            onClick={() => handleDelete(tarea)}
                            className="text-red-500 hover:text-red-600 text-xs font-medium cursor-pointer"
                          >
                            Eliminar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivar(tarea)}
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
