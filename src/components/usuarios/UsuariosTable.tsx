"use client";

import { Fragment, useState } from "react";
import type { FormEvent } from "react";
import { Role } from "@/generated/prisma/browser";
import { Pencil, Trash2 } from "lucide-react";
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
        <Button onClick={() => setShowForm((prev) => !prev)} variant="primary">
          {showForm ? "Cancelar" : "+ Nuevo usuario"}
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAddUsuario}
          className="mb-6 flex flex-col sm:flex-row flex-wrap gap-3 bg-white border border-gray-200 rounded-lg p-4"
        >
          <Input
            placeholder="Nombre"
            value={newNombre}
            onChange={(e) => setNewNombre(e.target.value)}
            required
            wrapperClassName="flex-1 min-w-[160px]"
          />

          <Input
            placeholder="Email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            wrapperClassName="flex-1 min-w-[200px]"
          />

          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-sidebar"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as Role)}
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>

          <Input
            placeholder="Contraseña"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            wrapperClassName="flex-1 min-w-[160px]"
          />

          <Button type="submit" variant="success" loading={submitting}>
            {submitting ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      )}

      <Table>
        <TableHead>
          <TableHeaderCell>Nombre</TableHeaderCell>
          <TableHeaderCell>Email</TableHeaderCell>
          <TableHeaderCell>Rol</TableHeaderCell>
          <TableHeaderCell>Acciones</TableHeaderCell>
        </TableHead>
        <TableBody>
          {usuarios.map((usuario, index) => {
            const isEditing = editingId === usuario.id;
            const isResetting = resettingId === usuario.id;
            const isSelf = usuario.id === currentUserId;

            return (
              <Fragment key={usuario.id}>
                <TableRow index={index}>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={editNombre}
                        onChange={(e) => setEditNombre(e.target.value)}
                        compact
                      />
                    ) : (
                      <span className="text-gray-800 font-medium">
                        {usuario.nombre}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        compact
                      />
                    ) : (
                      <span className="text-gray-600">{usuario.email}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <select
                        className="w-full border border-gray-300 rounded px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-sidebar"
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
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSaveEdit(usuario.id)}
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
                          onClick={() => startEditing(usuario)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Editar"
                          aria-label="Editar"
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startResetPassword(usuario)}
                          className="text-amber-600 hover:text-amber-700"
                        >
                          Restablecer contraseña
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(usuario)}
                          disabled={isSelf}
                          title={
                            isSelf
                              ? "No puedes eliminar tu propio usuario"
                              : "Eliminar"
                          }
                          aria-label="Eliminar"
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>

                {isResetting && (
                  <TableRow index={index}>
                    <TableCell colSpan={4} className="py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">
                          Nueva contraseña para {usuario.nombre}:
                        </span>
                        <Input
                          type="password"
                          value={resetPassword}
                          onChange={(e) => setResetPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          compact
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSaveResetPassword(usuario.id)}
                          loading={submitting}
                          className="text-green-600 hover:text-green-700"
                        >
                          Guardar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelResetPassword}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
