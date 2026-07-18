"use client";

import { Fragment, useState } from "react";
import type { FormEvent } from "react";
import { Role } from "@/generated/prisma/browser";

const ROLE_OPTIONS = Object.values(Role);

type Usuario = {
  id: string;
  nombre: string;
  email: string;
  role: Role;
};

type Props = {
  initialUsuarios: Usuario[];
  currentUserId: string;
};

function sortByNombre(usuarios: Usuario[]) {
  return [...usuarios].sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export default function UsuariosTable({ initialUsuarios, currentUserId }: Props) {
  const [usuarios, setUsuarios] = useState<Usuario[]>(
    sortByNombre(initialUsuarios)
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [newNombre, setNewNombre] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<Role>(ROLE_OPTIONS[0]);
  const [newPassword, setNewPassword] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<Role>(ROLE_OPTIONS[0]);

  const [resettingId, setResettingId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");

  async function handleAddUsuario(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: newNombre,
        email: newEmail,
        role: newRole,
        password: newPassword,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Error al crear el usuario");
      return;
    }

    setUsuarios((prev) => sortByNombre([...prev, data]));
    setNewNombre("");
    setNewEmail("");
    setNewRole(ROLE_OPTIONS[0]);
    setNewPassword("");
    setShowForm(false);
  }

  function startEditing(usuario: Usuario) {
    setError(null);
    setResettingId(null);
    setEditingId(usuario.id);
    setEditNombre(usuario.nombre);
    setEditEmail(usuario.email);
    setEditRole(usuario.role);
  }

  function cancelEditing() {
    setEditingId(null);
  }

  async function handleSaveEdit(id: string) {
    setError(null);
    setSubmitting(true);

    const res = await fetch(`/api/usuarios/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: editNombre,
        email: editEmail,
        role: editRole,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Error al actualizar el usuario");
      return;
    }

    setUsuarios((prev) =>
      sortByNombre(prev.map((u) => (u.id === id ? data : u)))
    );
    setEditingId(null);
  }

  function startResetPassword(usuario: Usuario) {
    setError(null);
    setEditingId(null);
    setResettingId(usuario.id);
    setResetPassword("");
  }

  function cancelResetPassword() {
    setResettingId(null);
    setResetPassword("");
  }

  async function handleSaveResetPassword(id: string) {
    setError(null);
    setSubmitting(true);

    const res = await fetch(`/api/usuarios/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: resetPassword }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Error al restablecer la contraseña");
      return;
    }

    setResettingId(null);
    setResetPassword("");
  }

  async function handleDelete(usuario: Usuario) {
    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar a "${usuario.nombre}"? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setError(null);

    const res = await fetch(`/api/usuarios/${usuario.id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al eliminar el usuario");
      return;
    }

    setUsuarios((prev) => prev.filter((u) => u.id !== usuario.id));
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
          {showForm ? "Cancelar" : "+ Nuevo usuario"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAddUsuario}
          className="mb-6 flex flex-col sm:flex-row flex-wrap gap-3 bg-white border border-gray-200 rounded-lg p-4"
        >
          <input
            className="flex-1 min-w-[160px] border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400"
            placeholder="Nombre"
            value={newNombre}
            onChange={(e) => setNewNombre(e.target.value)}
            required
          />

          <input
            className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400"
            placeholder="Email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
          />

          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as Role)}
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>

          <input
            className="flex-1 min-w-[160px] border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400"
            placeholder="Contraseña"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
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
                Email
              </th>
              <th className="border border-blue-500 px-4 py-3 text-left">
                Rol
              </th>
              <th className="border border-blue-500 px-4 py-3 text-left">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario, index) => {
              const rowBg = index % 2 === 0 ? "bg-white" : "bg-gray-50";
              const isEditing = editingId === usuario.id;
              const isResetting = resettingId === usuario.id;
              const isSelf = usuario.id === currentUserId;

              return (
                <Fragment key={usuario.id}>
                  <tr className={rowBg}>
                    <td className="border border-gray-200 px-4 py-2">
                      {isEditing ? (
                        <input
                          className="w-full border border-gray-300 rounded px-2 py-1 text-gray-700"
                          value={editNombre}
                          onChange={(e) => setEditNombre(e.target.value)}
                        />
                      ) : (
                        <span className="text-gray-800 font-medium">
                          {usuario.nombre}
                        </span>
                      )}
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      {isEditing ? (
                        <input
                          className="w-full border border-gray-300 rounded px-2 py-1 text-gray-700"
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                        />
                      ) : (
                        <span className="text-gray-600">{usuario.email}</span>
                      )}
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      {isEditing ? (
                        <select
                          className="w-full border border-gray-300 rounded px-2 py-1 text-gray-700"
                          value={editRole}
                          onChange={(e) =>
                            setEditRole(e.target.value as Role)
                          }
                        >
                          {ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-gray-600">{usuario.role}</span>
                      )}
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      {isEditing ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(usuario.id)}
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
                            onClick={() => startEditing(usuario)}
                            className="text-blue-600 hover:text-blue-700 text-xs font-medium cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => startResetPassword(usuario)}
                            className="text-amber-600 hover:text-amber-700 text-xs font-medium cursor-pointer"
                          >
                            Restablecer contraseña
                          </button>
                          <button
                            onClick={() => handleDelete(usuario)}
                            disabled={isSelf}
                            title={
                              isSelf
                                ? "No puedes eliminar tu propio usuario"
                                : undefined
                            }
                            className="text-red-500 hover:text-red-600 text-xs font-medium cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>

                  {isResetting && (
                    <tr className={rowBg}>
                      <td
                        colSpan={4}
                        className="border border-gray-200 px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500">
                            Nueva contraseña para {usuario.nombre}:
                          </span>
                          <input
                            className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-700"
                            type="password"
                            value={resetPassword}
                            onChange={(e) => setResetPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                          />
                          <button
                            onClick={() => handleSaveResetPassword(usuario.id)}
                            disabled={submitting}
                            className="text-green-600 hover:text-green-700 text-xs font-medium cursor-pointer disabled:opacity-50"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={cancelResetPassword}
                            className="text-gray-500 hover:text-gray-700 text-xs font-medium cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
