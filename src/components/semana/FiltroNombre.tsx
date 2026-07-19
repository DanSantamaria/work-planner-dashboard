"use client";

import { useState } from "react";
import SemanaGrid from "@/components/semana/SemanaGrid";
import { ScanSearch } from "lucide-react";
import type { AsignacionCelda } from "@/lib/agrupar-asignaciones";

type Empleado = {
  id: string;
  nombre: string;
  lob: string;
  horario: string;
};

type TareaDisponible = { id: string; nombre: string };

type Props = {
  fechaInicio: string;
  empleados: Empleado[];
  tareas: Record<string, Record<number, AsignacionCelda[]>>;
  editable?: boolean;
  tareasDisponibles?: TareaDisponible[];
  onNombreChange?: (empleadoId: string, nuevoNombre: string) => void;
  onHorarioChange?: (empleadoId: string, nuevoHorario: string) => void;
  onTareasChange?: (
    empleadoId: string,
    diaSemana: number,
    nuevasTareaIds: string[]
  ) => void;
};

export default function FiltroNombre({
  fechaInicio,
  empleados,
  tareas,
  editable,
  tareasDisponibles,
  onNombreChange,
  onHorarioChange,
  onTareasChange,
}: Props) {
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
      <SemanaGrid
        fechaInicio={fechaInicio}
        empleados={empleadosFiltrados}
        tareas={tareas}
        editable={editable}
        tareasDisponibles={tareasDisponibles}
        onNombreChange={onNombreChange}
        onHorarioChange={onHorarioChange}
        onTareasChange={onTareasChange}
      />
    </div>
  );
}
