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

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
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
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700"
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
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer"
            >
              {creando ? "Creando..." : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
