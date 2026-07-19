"use client";

import { useState, useRef, useEffect } from "react";

type Tarea = { id: string; nombre: string };

type Props = {
  tareasDisponibles: Tarea[];
  seleccionadas: string[];
  onChange: (nuevasSeleccionadas: string[]) => void;
};

export default function TareaDropdown({
  tareasDisponibles,
  seleccionadas,
  onChange,
}: Props) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickFuera(e: MouseEvent) {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(e.target as Node)
      ) {
        setAbierto(false);
      }
    }

    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, []);

  function toggleTarea(tareaId: string) {
    if (seleccionadas.includes(tareaId)) {
      onChange(seleccionadas.filter((id) => id !== tareaId));
    } else {
      onChange([...seleccionadas, tareaId]);
    }
  }

  const tareasSeleccionadas = tareasDisponibles.filter((t) =>
    seleccionadas.includes(t.id)
  );

  return (
    <div ref={contenedorRef} className="relative min-h-[2rem]">
      <button
        type="button"
        onClick={() => setAbierto((prev) => !prev)}
        className="w-full text-left cursor-pointer"
      >
        {tareasSeleccionadas.length === 0 ? (
          <span className="text-gray-400 text-xs italic">+ Añadir tarea</span>
        ) : (
          <div className="flex max-w-[220px] flex-wrap gap-1">
            {tareasSeleccionadas.map((t) => (
              <span
                key={t.id}
                className="inline-block bg-gray-200 text-gray-700 rounded-md text-xs px-2 py-1"
              >
                {t.nombre}
              </span>
            ))}
          </div>
        )}
      </button>

      {abierto && (
        <div className="absolute z-30 mt-1 w-64 max-h-64 overflow-y-auto rounded-lg border border-gray-300 bg-white p-2 shadow-lg">
          {tareasDisponibles.map((tarea) => (
            <label
              key={tarea.id}
              className="flex items-center gap-2 px-2 py-1 text-sm text-gray-700 hover:bg-gray-50 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={seleccionadas.includes(tarea.id)}
                onChange={() => toggleTarea(tarea.id)}
              />
              {tarea.nombre}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
