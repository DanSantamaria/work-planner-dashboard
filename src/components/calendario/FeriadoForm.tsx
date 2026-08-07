"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export type Feriado = { id: string; fecha: string; nombre: string };

type Props = {
  onClose: () => void;
  feriadoExistente?: Feriado | null;
  fechaPrellenada?: string | null;
  onGuardado: () => void;
};

// Content only — no overlay/card shell, no open prop. EventoFeriadoModal
// owns the shell and decides when this is even mounted at all.
export default function FeriadoForm({
  onClose,
  feriadoExistente,
  fechaPrellenada,
  onGuardado,
}: Props) {
  const modoEdicion = !!feriadoExistente;

  const [fecha, setFecha] = useState(
    feriadoExistente?.fecha.slice(0, 10) ?? fechaPrellenada ?? ""
  );
  const [nombre, setNombre] = useState(feriadoExistente?.nombre ?? "");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  async function handleGuardar() {
    setError(null);

    if (!fecha) {
      setError("Selecciona una fecha");
      return;
    }
    if (!nombre.trim()) {
      setError("El nombre del feriado es obligatorio");
      return;
    }

    setGuardando(true);

    const url = modoEdicion
      ? `/api/feriados/${feriadoExistente.id}`
      : "/api/feriados";
    const method = modoEdicion ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fecha, nombre: nombre.trim() }),
    });

    const data = await res.json();
    setGuardando(false);

    if (!res.ok) {
      setError(data.error ?? "No se pudo guardar el feriado");
      return;
    }

    onGuardado();
    onClose();
  }

  async function handleEliminar() {
    if (!feriadoExistente) return;
    const confirmado = window.confirm(
      "¿Seguro que quieres eliminar este feriado?"
    );
    if (!confirmado) return;

    setEliminando(true);
    setError(null);

    const res = await fetch(`/api/feriados/${feriadoExistente.id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    setEliminando(false);

    if (!res.ok) {
      setError(data.error ?? "No se pudo eliminar el feriado");
      return;
    }

    onGuardado();
    onClose();
  }

  return (
    <>
      <h2 className="text-lg font-bold text-gray-800 mb-4">
        {modoEdicion ? "Editar feriado" : "Nuevo feriado"}
      </h2>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <Input
          type="date"
          label="Fecha"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
        <Input
          label="Nombre"
          placeholder="Ej. Fiesta Nacional de España"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div>
          {modoEdicion && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleEliminar}
              loading={eliminando}
            >
              Eliminar
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleGuardar}
            loading={guardando}
          >
            Guardar
          </Button>
        </div>
      </div>
    </>
  );
}
