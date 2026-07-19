export type AsignacionCelda = { tareaId: string; nombre: string };

export type AsignacionConTarea = {
  empleadoId: string;
  diaSemana: number;
  tarea: { id: string; nombre: string };
};

export function agruparAsignaciones(asignaciones: AsignacionConTarea[]) {
  const resultado: Record<string, Record<number, AsignacionCelda[]>> = {};

  for (const a of asignaciones) {
    if (!resultado[a.empleadoId]) {
      resultado[a.empleadoId] = {};
    }
    if (!resultado[a.empleadoId][a.diaSemana]) {
      resultado[a.empleadoId][a.diaSemana] = [];
    }
    resultado[a.empleadoId][a.diaSemana].push({
      tareaId: a.tarea.id,
      nombre: a.tarea.nombre,
    });
  }

  return resultado;
}
