"use client";

import { useState } from "react";
import { Pencil, X } from "lucide-react";
import SemanaGrid from "@/components/semana/SemanaGrid";
import SegmentedControl from "@/components/ui/SegmentedControl";
import SemanaEditBar from "@/components/semana/SemanaEditBar";
import NuevaSemanaModal from "@/components/semana/NuevaSemanaModal";
import { addDays } from "@/lib/date-utils";
import { formatearDia, formatearRango } from "@/lib/formato-fecha";
import { useBusqueda } from "@/context/BusquedaContext";
import { useEsMovil } from "@/hooks/useEsMovil";
import { ordenarEmpleadosFlat } from "@/lib/orden-empleados";
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

type Vista = "DIA" | "SEMANA";

// Weeks here are Lunes(1)..Viernes(5) — the diaSemana numbering used by the
// assignments, not JavaScript's getDay().
const DIA_MIN = 1;
const DIA_MAX = 5;

const ETIQUETAS_VISTA: Record<Vista, string> = {
  DIA: "Día",
  SEMANA: "Semana",
};

// Assignments are stored with diaSemana 1..5 (Lunes..Viernes), while
// JavaScript's getDay() runs 0..6 starting on Sunday. Monday through Friday
// happen to line up (1..5), so only the weekend needs handling: Saturday and
// Sunday have no column here, and land on Viernes instead of an empty screen.
function diaSemanaDeHoy(): number {
  const jsDia = new Date().getDay();
  if (jsDia === 0 || jsDia === 6) return DIA_MAX;
  return jsDia;
}

// Same wording as /calendario ("17-21 Agosto, 2026"), just over a shorter
// span: weeks here run Lunes–Viernes, five days instead of seven.
function formatearRangoSemana(fechaInicio: string): string {
  const inicio = new Date(fechaInicio);
  return formatearRango(inicio, addDays(inicio, 4));
}

// diaSemana is 1..5, so day 1 is the Monday itself — hence the -1.
function fechaDelDia(fechaInicio: string, diaSemana: number): Date {
  return addDays(new Date(fechaInicio), diaSemana - 1);
}

function tareasDelEmpleadoIncluyenTexto(
  tareasEmpleado: Record<number, AsignacionCelda[]> | undefined,
  texto: string,
  diaVisible?: number
): boolean {
  if (!tareasEmpleado) return false;

  // tareasEmpleado está indexado por día (1-5). En vista Semana se recorren
  // los cinco; en vista Día, solo el que está en pantalla — si no, buscar
  // "RECEPCION" dejaría visible a alguien que hace recepción otro día,
  // mientras la columna de enfrente dice otra cosa, y se lee como un error.
  const diasABuscar =
    diaVisible === undefined
      ? Object.values(tareasEmpleado)
      : [tareasEmpleado[diaVisible] ?? []];

  return diasABuscar.some((asignacionesDelDia) =>
    asignacionesDelDia.some((asignacion) =>
      asignacion.nombre.toLowerCase().includes(texto)
    )
  );
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
  // Five columns don't fit a phone; one does. Rather than forcing a view on
  // mount, the choice stays empty until someone makes one, and until then the
  // screen width decides — so the default follows a rotation, and an explicit
  // pick is never overridden behind the user's back.
  const esMovil = useEsMovil();
  const [vistaElegida, setVistaElegida] = useState<Vista | null>(null);
  const vista: Vista = vistaElegida ?? (esMovil ? "DIA" : "SEMANA");
  // 1..5 — same numbering the assignments use, never JS's getDay().
  const [diaSeleccionado, setDiaSeleccionado] = useState(diaSemanaDeHoy);
  const [editMode, setEditMode] = useState(false);
  const [draftAsignaciones, setDraftAsignaciones] = useState<
    Record<string, Record<number, AsignacionCelda[]>>
  >({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [creandoSemana, setCreandoSemana] = useState(false);

  // Five columns don't fit a phone; one does. The switch happens after
  // mounting rather than during render because the server has no idea how
  // wide the screen is — deciding it while rendering would make the server's
  // HTML and the browser's first render disagree. Runs once on purpose: from
  // then on, the view is whatever the person chose.
  const semanaActual = semanas.find((s) => s.id === selectedWeekId) ?? null;
  const currentIndex = semanas.findIndex((s) => s.id === selectedWeekId);

  function confirmarDescartarCambios() {
    if (!editMode) return true;
    return window.confirm(
      "Tienes cambios sin guardar en esta semana. ¿Deseas descartarlos?"
    );
  }

  // Returns false when the user backed out of discarding an edit draft, so
  // callers can skip whatever they meant to do next (e.g. landing on a
  // particular weekday of the week they didn't end up moving to).
  function irASemana(id: string): boolean {
    if (!confirmarDescartarCambios()) return false;
    setEditMode(false);
    setError(null);
    setSelectedWeekId(id);
    return true;
  }

  // The arrows step through whatever the current view is made of: days in
  // Día, weeks in Semana — the same rule /calendario follows. Stepping off
  // either end of the week rolls into the neighbouring one, which counts as
  // a week change and therefore goes through the unsaved-changes guard.
  function irAnterior() {
    if (vista === "DIA" && diaSeleccionado > DIA_MIN) {
      setDiaSeleccionado((dia) => dia - 1);
      return;
    }

    if (currentIndex <= 0) return;
    if (!irASemana(semanas[currentIndex - 1].id)) return;
    if (vista === "DIA") setDiaSeleccionado(DIA_MAX);
  }

  function irSiguiente() {
    if (vista === "DIA" && diaSeleccionado < DIA_MAX) {
      setDiaSeleccionado((dia) => dia + 1);
      return;
    }

    if (currentIndex < 0 || currentIndex >= semanas.length - 1) return;
    if (!irASemana(semanas[currentIndex + 1].id)) return;
    if (vista === "DIA") setDiaSeleccionado(DIA_MIN);
  }

  // In Día there is somewhere to go as long as days remain in this week,
  // even when it is the first or last week loaded.
  const hayAnterior =
    currentIndex > 0 || (vista === "DIA" && diaSeleccionado > DIA_MIN);
  const haySiguiente =
    (currentIndex >= 0 && currentIndex < semanas.length - 1) ||
    (vista === "DIA" && diaSeleccionado < DIA_MAX);

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

  const textoBusqueda = busqueda.toLowerCase();
  const empleadosOrdenados = ordenarEmpleadosFlat(empleados).filter((empleado) => {
    const coincideNombre = empleado.nombre
      .toLowerCase()
      .includes(textoBusqueda);
    const coincideTarea = tareasDelEmpleadoIncluyenTexto(
      tareasParaGrid[empleado.id],
      textoBusqueda,
      vista === "DIA" ? diaSeleccionado : undefined
    );

    return coincideNombre || coincideTarea;
  });

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
            disabled={!hayAnterior}
            className="cursor-pointer px-2 py-1 text-lg text-accent hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-30"
          >
            ◄
          </button>
          <span className="text-lg font-bold text-accent">
            {vista === "DIA"
              ? formatearDia(
                  fechaDelDia(semanaActual.fechaInicio, diaSeleccionado)
                )
              : formatearRangoSemana(semanaActual.fechaInicio)}
          </span>
          <button
            onClick={irSiguiente}
            disabled={!haySiguiente}
            className="cursor-pointer px-2 py-1 text-lg text-accent hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-30"
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

        {/* mx-auto centra el selector en el espacio que queda entre el grupo
            de la izquierda y el de la derecha, igual que en /calendario. */}
        <div className="mx-auto">
          <SegmentedControl
            etiquetaGrupo="Vista de la planificación"
            opciones={(Object.keys(ETIQUETAS_VISTA) as Vista[]).map((v) => ({
              valor: v,
              etiqueta: ETIQUETAS_VISTA[v],
            }))}
            valor={vista}
            onChange={setVistaElegida}
          />
        </div>

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
        diaVisible={vista === "DIA" ? diaSeleccionado : undefined}
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
