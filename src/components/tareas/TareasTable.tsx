"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useBusqueda } from "@/context/BusquedaContext";
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
  const { busqueda } = useBusqueda();
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
        <Button onClick={() => setShowForm((prev) => !prev)} variant="primary">
          {showForm ? "Cancelar" : "+ Nueva tarea"}
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAddTarea}
          className="mb-6 flex flex-col sm:flex-row gap-3 bg-white border border-gray-200 rounded-lg p-4"
        >
          <Input
            placeholder="Nombre de la tarea"
            value={newNombre}
            onChange={(e) => setNewNombre(e.target.value)}
            required
            wrapperClassName="flex-1"
          />
          <Input
            placeholder="Descripción (opcional)"
            value={newDescripcion}
            onChange={(e) => setNewDescripcion(e.target.value)}
            wrapperClassName="flex-1"
          />
          <Button type="submit" variant="success" loading={submitting}>
            {submitting ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      )}

      <Table>
        <TableHead>
          <TableHeaderCell>Nombre</TableHeaderCell>
          <TableHeaderCell>Descripción</TableHeaderCell>
          <TableHeaderCell>Estado</TableHeaderCell>
          <TableHeaderCell>Acciones</TableHeaderCell>
        </TableHead>
        <TableBody>
          {tareas
            .filter((tarea) =>
              tarea.nombre.toLowerCase().includes(busqueda.toLowerCase())
            )
            .map((tarea, index) => {
              const isEditing = editingId === tarea.id;

              return (
                <TableRow key={tarea.id} index={index}>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={editNombre}
                        onChange={(e) => setEditNombre(e.target.value)}
                        compact
                      />
                    ) : (
                      <span className="text-gray-800 font-medium">
                        {tarea.nombre}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={editDescripcion}
                        onChange={(e) => setEditDescripcion(e.target.value)}
                        compact
                      />
                    ) : (
                      <span className="text-gray-600">
                        {tarea.descripcion || "—"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={tarea.activa ? "success" : "default"}>
                      {tarea.activa ? "Activa" : "Inactiva"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSaveEdit(tarea.id)}
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
                          onClick={() => startEditing(tarea)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Editar"
                          aria-label="Editar"
                        >
                          <Pencil size={16} />
                        </Button>
                        {tarea.activa ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(tarea)}
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
                            onClick={() => handleReactivar(tarea)}
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
