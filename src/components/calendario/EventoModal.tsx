"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";

export type TipoEventoValor = "VACACION" | "AUSENCIA" | "NOTA";
export type OrigenVacacionValor = "ANIO_ANTERIOR" | "ANIO_ACTUAL";
export type TipoHorasValor = "MEDICA" | "EXCESO";

// The full shape staff sees from the API — richer than calendario-celda's
// EventoCalendario, which only carries what's needed to color a cell.
export type EventoCompleto = {
  id: string;
  fecha: string;
  tipo: TipoEventoValor;
  origenVacacion: OrigenVacacionValor | null;
  justificada: boolean | null;
  tipoHoras: TipoHorasValor | null;
  horas: number | null;
  notas: string | null;
  empleadoId: string;
};

type Empleado = { id: string; nombre: string };

type Props = {
  onClose: () => void;
  empleados: Empleado[];
  eventoExistente?: EventoCompleto | null;
  prellenado?: { empleadoId: string; fecha: string } | null;
  onGuardado: () => void;
};

const TIPO_OPTIONS: {
  valor: TipoEventoValor;
  etiqueta: string;
  variant: "vacacion" | "ausente" | "nota";
}[] = [
  { valor: "VACACION", etiqueta: "Vacaciones", variant: "vacacion" },
  { valor: "AUSENCIA", etiqueta: "Ausencia", variant: "ausente" },
  { valor: "NOTA", etiqueta: "Incidencia", variant: "nota" },
];

const JUSTIFICADA_OPTIONS: { valor: boolean | null; etiqueta: string }[] = [
  { valor: true, etiqueta: "Sí" },
  { valor: false, etiqueta: "No" },
  { valor: null, etiqueta: "Pendiente" },
];

// Content only — no overlay/card shell, no open prop. EventoFeriadoModal
// owns the shell and decides when this is even mounted at all.
export default function EventoModal({
  onClose,
  empleados,
  eventoExistente,
  prellenado,
  onGuardado,
}: Props) {
  const modoEdicion = !!eventoExistente;

  const [empleadoId, setEmpleadoId] = useState(
    eventoExistente?.empleadoId ?? prellenado?.empleadoId ?? empleados[0]?.id ?? ""
  );
  const [tipo, setTipo] = useState<TipoEventoValor>(
    eventoExistente?.tipo ?? "VACACION"
  );
  const [fechaInicio, setFechaInicio] = useState(
    eventoExistente?.fecha.slice(0, 10) ?? prellenado?.fecha ?? ""
  );
  const [fechaFin, setFechaFin] = useState(
    eventoExistente?.fecha.slice(0, 10) ?? prellenado?.fecha ?? ""
  );
  const [origenVacacion, setOrigenVacacion] = useState<OrigenVacacionValor>(
    eventoExistente?.origenVacacion ?? "ANIO_ACTUAL"
  );
  const [justificada, setJustificada] = useState<boolean | null>(
    eventoExistente?.justificada ?? null
  );
  const [registrarHoras, setRegistrarHoras] = useState(
    !!eventoExistente?.tipoHoras
  );
  const [tipoHoras, setTipoHoras] = useState<TipoHorasValor>(
    eventoExistente?.tipoHoras ?? "MEDICA"
  );
  const [horas, setHoras] = useState(
    eventoExistente?.horas != null ? String(eventoExistente.horas) : ""
  );
  const [notas, setNotas] = useState(eventoExistente?.notas ?? "");

  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  function alternarRegistrarHoras(valor: boolean) {
    setRegistrarHoras(valor);
    if (valor) {
      setFechaFin(fechaInicio);
    }
  }

  function handleFechaInicioChange(valor: string) {
    setFechaInicio(valor);
    if (registrarHoras) {
      setFechaFin(valor);
    }
  }

  async function handleGuardar() {
    setError(null);

    if (!empleadoId) {
      setError("Selecciona un empleado");
      return;
    }
    if (!fechaInicio || !fechaFin) {
      setError("Selecciona las fechas");
      return;
    }
    if (fechaInicio > fechaFin) {
      setError("La fecha de inicio no puede ser posterior a la fecha de fin");
      return;
    }
    if (tipo === "VACACION" && !origenVacacion) {
      setError("Indica si la vacación es del año anterior o del actual");
      return;
    }
    if (tipo === "NOTA" && registrarHoras) {
      const horasNum = Number(horas);
      if (!horas || isNaN(horasNum) || horasNum <= 0) {
        setError("Las horas deben ser un número mayor que cero");
        return;
      }
    }

    setGuardando(true);

    const body: Record<string, unknown> = modoEdicion
      ? {
          notas: notas.trim() || null,
          ...(tipo === "VACACION" && { origenVacacion }),
          ...(tipo === "AUSENCIA" && { justificada }),
          ...(tipo === "NOTA" && {
            tipoHoras: registrarHoras ? tipoHoras : null,
            horas: registrarHoras ? Number(horas) : null,
          }),
        }
      : {
          empleadoId,
          tipo,
          fechaInicio,
          fechaFin,
          notas: notas.trim() || null,
          ...(tipo === "VACACION" && { origenVacacion }),
          ...(tipo === "AUSENCIA" && { justificada }),
          ...(tipo === "NOTA" &&
            registrarHoras && { tipoHoras, horas: Number(horas) }),
        };

    const url = modoEdicion
      ? `/api/eventos/${eventoExistente.id}`
      : "/api/eventos";
    const method = modoEdicion ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setGuardando(false);

    if (!res.ok) {
      setError(data.error ?? "No se pudo guardar el evento");
      return;
    }

    onGuardado();
    onClose();
  }

  async function handleEliminar() {
    if (!eventoExistente) return;
    const confirmado = window.confirm(
      "¿Seguro que quieres eliminar este evento?"
    );
    if (!confirmado) return;

    setEliminando(true);
    setError(null);

    const res = await fetch(`/api/eventos/${eventoExistente.id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    setEliminando(false);

    if (!res.ok) {
      setError(data.error ?? "No se pudo eliminar el evento");
      return;
    }

    onGuardado();
    onClose();
  }

  return (
    <>
      <h2 className="text-lg font-bold text-gray-800 mb-4">
        {modoEdicion ? "Editar evento" : "Nuevo evento"}
      </h2>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Empleado
          </label>
          <select
            disabled={modoEdicion}
            value={empleadoId}
            onChange={(e) => setEmpleadoId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 disabled:bg-gray-100 disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sidebar"
          >
            {empleados.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo
          </label>
          <div className="flex gap-2">
            {TIPO_OPTIONS.map((opcion) => (
              <button
                key={opcion.valor}
                type="button"
                disabled={modoEdicion}
                onClick={() => setTipo(opcion.valor)}
                className={`disabled:cursor-not-allowed ${
                  tipo === opcion.valor ? "" : "opacity-40"
                }`}
              >
                <Badge variant={opcion.variant}>{opcion.etiqueta}</Badge>
              </button>
            ))}
          </div>
        </div>

        {modoEdicion && (
          <p className="-mt-2 text-xs text-gray-500">
            Para cambiar el tipo, la fecha o el empleado, elimina este
            evento y crea uno nuevo.
          </p>
        )}

        <div className="flex gap-3">
          <Input
            type="date"
            label="Desde"
            value={fechaInicio}
            onChange={(e) => handleFechaInicioChange(e.target.value)}
            disabled={modoEdicion}
            wrapperClassName="flex-1"
          />
          <Input
            type="date"
            label="Hasta"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            disabled={modoEdicion || (tipo === "NOTA" && registrarHoras)}
            wrapperClassName="flex-1"
          />
        </div>

        {tipo === "VACACION" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Origen
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  checked={origenVacacion === "ANIO_ACTUAL"}
                  onChange={() => setOrigenVacacion("ANIO_ACTUAL")}
                />
                Año actual
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  checked={origenVacacion === "ANIO_ANTERIOR"}
                  onChange={() => setOrigenVacacion("ANIO_ANTERIOR")}
                />
                Año anterior
              </label>
            </div>
          </div>
        )}

        {tipo === "AUSENCIA" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Justificada
            </label>
            <div className="flex gap-2">
              {JUSTIFICADA_OPTIONS.map((opcion) => (
                <button
                  key={String(opcion.valor)}
                  type="button"
                  onClick={() => setJustificada(opcion.valor)}
                  className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm ${
                    justificada === opcion.valor
                      ? "border-sidebar bg-sidebar text-white"
                      : "border-gray-300 text-gray-600"
                  }`}
                >
                  {opcion.etiqueta}
                </button>
              ))}
            </div>
          </div>
        )}

        {tipo === "NOTA" && (
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={registrarHoras}
                onChange={(e) => alternarRegistrarHoras(e.target.checked)}
              />
              ¿Registrar horas?
            </label>

            {registrarHoras && (
              <div className="flex gap-3">
                <select
                  value={tipoHoras}
                  onChange={(e) =>
                    setTipoHoras(e.target.value as TipoHorasValor)
                  }
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-sidebar"
                >
                  <option value="MEDICA">Médica</option>
                  <option value="EXCESO">Exceso</option>
                </select>
                <Input
                  type="number"
                  min={0}
                  step="0.5"
                  placeholder="Horas"
                  value={horas}
                  onChange={(e) => setHoras(e.target.value)}
                  wrapperClassName="flex-1"
                />
              </div>
            )}
          </div>
        )}

        <Input
          label="Notas"
          placeholder="Nota interna (opcional)"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
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
