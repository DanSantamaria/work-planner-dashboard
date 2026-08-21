"use client";

import { useState } from "react";
import type { FormEvent } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onCrear: (fecha: string) => void;
  creando: boolean;
};

export default function NuevaSemanaModal({
  open,
  onClose,
  onCrear,
  creando,
}: Props) {
  const [fecha, setFecha] = useState("");

  if (!open) return null;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (fecha) {
      onCrear(fecha);
    }
  }

  // Full-height sheet on a phone, centred card from md up: long forms (the
  // evento one especially) need somewhere to scroll, and a centred card ends
  // up half-hidden behind the on-screen keyboard.
  return (
    <div className="fixed inset-0 z-40 flex bg-black/40 md:items-center md:justify-center">
      <div className="flex h-full w-full flex-col overflow-y-auto bg-white p-6 md:h-auto md:max-h-[90vh] md:max-w-sm md:rounded-xl md:shadow-xl">
        <h2 className="text-lg font-bold text-gray-800 mb-2">Nueva Semana</h2>
        <p className="text-sm text-gray-500 mb-4">
          Elige cualquier día de la semana que quieres crear — se ajustará
          automáticamente al lunes correspondiente.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-sidebar"
          />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium px-4 py-2 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creando}
              className="bg-sidebar hover:opacity-90 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer"
            >
              {creando ? "Creando..." : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
