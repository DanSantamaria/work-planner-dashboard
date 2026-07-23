"use client";

import { useState } from "react";
import { Pencil, X } from "lucide-react";
import SemanaGrid from "@/components/semana/SemanaGrid";
import SemanaEditBar from "@/components/semana/SemanaEditBar";
import NuevaSemanaModal from "@/components/semana/NuevaSemanaModal";
import { addDays } from "@/lib/date-utils";
import { useBusqueda } from "@/context/BusquedaContext";
import {
  agruparAsignaciones,
  type AsignacionCelda,
  type AsignacionConTarea,
} from "@/lib/agrupar-asignaciones";

type Empleado = {
  id: string;
  nombre: string;
  lob: string;
  horario: string;
};

type TareaDisponible = { id: string; nombre: string };

type Semana = {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  publicada: boolean;
  asignaciones: AsignacionConTarea[];
};

type Props = {
  semanasIniciales: Semana[];
  semanaInicialId: string | null;
  empleadosIniciales: Empleado[];
  tareasDisponibles: TareaDisponible[];
  canEdit: boolean;
  isAdmin: boolean;
};

function formatearRangoSemana(fechaInicio: string) {
  const inicio = new Date(fechaInicio);
  const fin = addDays(inicio, 4);

  const fmt = (d: Date) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;

  return `${fmt(inicio)} - ${fmt(fin)}`;
}

function obtenerMinutosInicio(horario: string): number {
  const match = horario.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return Infinity;

  const horas = Number(match[1]);
  const minutos = Number(match[2]);
  const totalMinutos = horas * 60 + minutos;

  // 00:00 representa la medianoche del turno de noche (NOCTURNO), que debe
  // ir al final del orden, no al principio como sugeriría el valor 0.
  return totalMinutos === 0 ? 24 * 60 : totalMinutos;
}

function ordenarEmpleados(empleados: Empleado[]) {
  return [...empleados].sort((a, b) => {
    const aEsPaloma = a.nombre === "Paloma Sánchez";
    const bEsPaloma = b.nombre === "Paloma Sánchez";
    if (aEsPaloma && !bEsPaloma) return -1;
    if (bEsPaloma && !aEsPaloma) return 1;

    const aEsCoordinacion = a.lob === "COORDINACION";
    const bEsCoordinacion = b.lob === "COORDINACION";
    if (aEsCoordinacion && !bEsCoordinacion) return -1;
    if (bEsCoordinacion && !aEsCoordinacion) return 1;

    const diferenciaHorario =
      obtenerMinutosInicio(a.horario) - obtenerMinutosInicio(b.horario);
    if (diferenciaHorario !== 0) return diferenciaHorario;

    return a.lob.localeCompare(b.lob);
  });
}

export default function SemanaView({
  semanasIniciales,
  semanaInicialId,
  empleadosIniciales,
  tareasDisponibles,
  canEdit,
  isAdmin,
}: Props) {
  const { busqueda } = useBusqueda();
  const [semanas, setSemanas] = useState<Semana[]>(semanasIniciales);
  const [empleados, setEmpleados] = useState<Empleado[]>(empleadosIniciales);
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(
    semanaInicialId
  );
  const [editMode, setEditMode] = useState(false);
  const [draftAsignaciones, setDraftAsignaciones] = useState<
    Record<string, Record<number, AsignacionCelda[]>>
  >({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [creandoSemana, setCreandoSemana] = useState(false);

  const semanaActual = semanas.find((s) => s.id === selectedWeekId) ?? null;
  const currentIndex = semanas.findIndex((s) => s.id === selectedWeekId);

  function confirmarDescartarCambios() {
    if (!editMode) return true;
    return window.confirm(
      "Tienes cambios sin guardar en esta semana. ¿Deseas descartarlos?"
    );
  }

  function irASemana(id: string) {
    if (!confirmarDescartarCambios()) return;
    setEditMode(false);
    setError(null);
    setSelectedWeekId(id);
  }

  function irAnterior() {
    if (currentIndex > 0) {
      irASemana(semanas[currentIndex - 1].id);
    }
  }

  function irSiguiente() {
    if (currentIndex >= 0 && currentIndex < semanas.length - 1) {
      irASemana(semanas[currentIndex + 1].id);
    }
  }

  function handleEditarSemana() {
    if (!semanaActual) return;

    if (editMode) {
      if (!confirmarDescartarCambios()) return;
      setEditMode(false);
      return;
    }

    setDraftAsignaciones(agruparAsignaciones(semanaActual.asignaciones));
    setError(null);
    setEditMode(true);
  }

  async function handleNombreChange(empleadoId: string, nuevoNombre: string) {
    setError(null);

    const res = await fetch(`/api/empleados/${empleadoId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nuevoNombre }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Error al actualizar el nombre");
      return;
    }

    setEmpleados((prev) =>
      prev.map((e) => (e.id === empleadoId ? { ...e, nombre: data.nombre } : e))
    );
  }

  async function handleHorarioChange(empleadoId: string, nuevoHorario: string) {
    setError(null);

    const res = await fetch(`/api/empleados/${empleadoId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ horario: nuevoHorario }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Error al actualizar el horario");
      return;
    }

    setEmpleados((prev) =>
      prev.map((e) =>
        e.id === empleadoId ? { ...e, horario: data.horario } : e
      )
    );
  }

  function handleTareasChange(
    empleadoId: string,
    diaSemana: number,
    nuevasTareaIds: string[]
  ) {
    setDraftAsignaciones((prev) => {
      const nuevo = { ...prev };
      const celdasEmpleado = { ...(nuevo[empleadoId] ?? {}) };

      celdasEmpleado[diaSemana] = nuevasTareaIds.map((tareaId) => {
        const tarea = tareasDisponibles.find((t) => t.id === tareaId);
        return { tareaId, nombre: tarea?.nombre ?? "" };
      });

      nuevo[empleadoId] = celdasEmpleado;
      return nuevo;
    });
  }

  function draftToArray() {
    const resultado: { empleadoId: string; diaSemana: number; tareaId: string }[] =
      [];

    for (const empleadoId in draftAsignaciones) {
      for (const diaSemanaStr in draftAsignaciones[empleadoId]) {
        const diaSemana = Number(diaSemanaStr);
        for (const celda of draftAsignaciones[empleadoId][diaSemana]) {
          resultado.push({ empleadoId, diaSemana, tareaId: celda.tareaId });
        }
      }
    }

    return resultado;
  }

  async function guardarAsignaciones(): Promise<boolean> {
    if (!semanaActual) return false;

    const res = await fetch(`/api/semanas/${semanaActual.id}/asignaciones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ asignaciones: draftToArray() }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Error al guardar las asignaciones");
      return false;
    }

    setSemanas((prev) => prev.map((s) => (s.id === data.id ? data : s)));
    return true;
  }

  async function handleGuardar() {
    setError(null);
    setSaving(true);
    const ok = await guardarAsignaciones();
    setSaving(false);
    if (ok) setEditMode(false);
  }

  async function handlePublicar() {
    if (!semanaActual) return;

    setError(null);
    setSaving(true);

    const ok = await guardarAsignaciones();
    if (!ok) {
      setSaving(false);
      return;
    }

    const res = await fetch(`/api/semanas/${semanaActual.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicada: true }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Error al publicar la semana");
      return;
    }

    setSemanas((prev) => prev.map((s) => (s.id === data.id ? data : s)));
    setEditMode(false);
  }

  async function handleDespublicar() {
    if (!semanaActual) return;

    setError(null);
    setSaving(true);

    const res = await fetch(`/api/semanas/${semanaActual.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicada: false }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Error al despublicar la semana");
      return;
    }

    setSemanas((prev) => prev.map((s) => (s.id === data.id ? data : s)));
  }

  async function handleEliminar() {
    if (!semanaActual) return;

    const confirmado = window.confirm(
      `¿Seguro que quieres eliminar la semana del ${formatearRangoSemana(
        semanaActual.fechaInicio
      )}? Esta acción no se puede deshacer.`
    );
    if (!confirmado) return;

    setError(null);
    setSaving(true);

    const res = await fetch(`/api/semanas/${semanaActual.id}`, {
      method: "DELETE",
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al eliminar la semana");
      return;
    }

    const restantes = semanas.filter((s) => s.id !== semanaActual.id);
    setSemanas(restantes);
    setEditMode(false);
    setSelectedWeekId(restantes.length > 0 ? restantes[0].id : null);
  }

  async function handleCrearSemana(fecha: string) {
    setError(null);
    setCreandoSemana(true);

    const masReciente =
      semanas.length > 0
        ? semanas.reduce((a, b) => (a.fechaInicio > b.fechaInicio ? a : b))
        : undefined;

    const res = await fetch("/api/semanas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fechaInicio: fecha,
        copiarDeSemanaId: masReciente?.id,
      }),
    });

    const data = await res.json();
    setCreandoSemana(false);

    if (!res.ok) {
      setError(data.error ?? "Error al crear la semana");
      return;
    }

    setSemanas((prev) =>
      [...prev, data].sort((a, b) => (a.fechaInicio > b.fechaInicio ? 1 : -1))
    );
    setEditMode(false);
    setSelectedWeekId(data.id);
    setShowModal(false);
  }

  if (!semanaActual) {
    return (
      <div>
        {canEdit && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-sidebar hover:opacity-90 text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer"
          >
            + Nueva Semana
          </button>
        )}
        <p className="text-gray-500 mt-4">Todavía no hay semanas creadas.</p>
        <NuevaSemanaModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onCrear={handleCrearSemana}
          creando={creandoSemana}
        />
      </div>
    );
  }

  const tareasParaGrid = editMode
    ? draftAsignaciones
    : agruparAsignaciones(semanaActual.asignaciones);

  const empleadosOrdenados = ordenarEmpleados(empleados).filter((empleado) =>
    empleado.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={irAnterior}
            disabled={currentIndex <= 0}
            className="cursor-pointer text-lg text-accent hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-30"
          >
            ◄
          </button>
          <span className="text-lg font-bold text-accent">
            Semana {formatearRangoSemana(semanaActual.fechaInicio)}
          </span>
          <button
            onClick={irSiguiente}
            disabled={currentIndex < 0 || currentIndex >= semanas.length - 1}
            className="cursor-pointer text-lg text-accent hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-30"
          >
            ►
          </button>
        </div>

        {canEdit && (
          <button
            onClick={() => setShowModal(true)}
            className="cursor-pointer rounded-lg bg-sidebar px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            + Nueva Semana
          </button>
        )}

        <span className="ml-auto text-sm text-gray-600">
          Estado: {semanaActual.publicada ? "Publicada 🟢" : "Borrador 🟡"}
        </span>

        {canEdit && (
          <button
            onClick={handleEditarSemana}
            title={editMode ? "Cancelar Edición" : "Editar Semana"}
            className="cursor-pointer rounded-lg bg-sidebar p-2 text-white hover:opacity-90"
          >
            {editMode ? <X size={18} /> : <Pencil size={18} />}
          </button>
        )}
      </div>

      <SemanaGrid
        fechaInicio={semanaActual.fechaInicio}
        empleados={empleadosOrdenados}
        tareas={tareasParaGrid}
        editable={editMode}
        tareasDisponibles={tareasDisponibles}
        onNombreChange={handleNombreChange}
        onHorarioChange={handleHorarioChange}
        onTareasChange={handleTareasChange}
      />

      {editMode && (
        <SemanaEditBar
          publicada={semanaActual.publicada}
          isAdmin={isAdmin}
          saving={saving}
          onGuardar={handleGuardar}
          onPublicar={handlePublicar}
          onDespublicar={handleDespublicar}
          onEliminar={handleEliminar}
        />
      )}

      <NuevaSemanaModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCrear={handleCrearSemana}
        creando={creandoSemana}
      />
    </div>
  );
}
