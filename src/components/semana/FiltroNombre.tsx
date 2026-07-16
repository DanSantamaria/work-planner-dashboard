"use client";

import { useState } from "react";
import SemanaGrid from "@/components/semana/SemanaGrid";
import { ScanSearch } from "lucide-react";

type Empleado = {
  id: string;
  nombre: string;
  lob: string;
  horario: string;
};

type Props = {
  empleados: Empleado[];
  tareas: Record<string, Record<number, string[]>>;
};

export default function FiltroNombre({ empleados, tareas }: Props) {
  const [filtro, setFiltro] = useState("");

  const empleadosFiltrados = empleados.filter((empleado) =>
    empleado.nombre.toLowerCase().includes(filtro.toLowerCase()),
  );

  return (
    <div>
      <div className="flex">
        <ScanSearch className="text-blue-500 mr-2" size={40} />
        <input
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Buscar empleado..."
          className="border border-gray-400 rounded-lg px-4 py-2 mb-4 text-sm text-gray-800 placeholder:text-gray-400"
        />
      </div>
      <SemanaGrid empleados={empleadosFiltrados} tareas={tareas} />
    </div>
  );
}
