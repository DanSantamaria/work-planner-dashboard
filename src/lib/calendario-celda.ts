export type EventoCalendario = {
  id: string;
  fecha: string;
  tipo: "VACACION" | "AUSENCIA" | "NOTA";
  origenVacacion: "ANIO_ANTERIOR" | "ANIO_ACTUAL" | null;
  empleadoId: string;
  notas?: string | null;
};

export type FeriadoCalendario = {
  id: string;
  fecha: string;
  nombre: string;
};

export type CeldaInfo<E extends EventoCalendario = EventoCalendario> =
  | { tipo: "feriado"; etiqueta: string }
  | { tipo: "finDeSemana" }
  | {
      tipo: "evento";
      evento: E;
      variant: "vacacion" | "vacacionAnterior" | "ausente" | "nota";
    }
  | { tipo: "normal" };

function mismaFecha(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

export function esFinDeSemana(fecha: Date): boolean {
  const dia = fecha.getDay();
  return dia === 0 || dia === 6;
}

/**
 * What a single (fecha, empleado) calendar cell should show — feriado and
 * weekend take priority over any Evento, since the whole office is closed
 * on those days regardless of what's recorded for an individual employee.
 */
export function resolverCelda<E extends EventoCalendario>(
  fecha: Date,
  empleadoId: string,
  eventos: E[],
  feriados: FeriadoCalendario[]
): CeldaInfo<E> {
  const feriado = feriados.find((f) => mismaFecha(new Date(f.fecha), fecha));
  if (feriado) {
    return { tipo: "feriado", etiqueta: feriado.nombre };
  }

  if (esFinDeSemana(fecha)) {
    return { tipo: "finDeSemana" };
  }

  const evento = eventos.find(
    (e) => e.empleadoId === empleadoId && mismaFecha(new Date(e.fecha), fecha)
  );

  if (!evento) {
    return { tipo: "normal" };
  }

  if (evento.tipo === "VACACION") {
    return {
      tipo: "evento",
      evento,
      variant:
        evento.origenVacacion === "ANIO_ANTERIOR"
          ? "vacacionAnterior"
          : "vacacion",
    };
  }

  if (evento.tipo === "AUSENCIA") {
    return { tipo: "evento", evento, variant: "ausente" };
  }

  return { tipo: "evento", evento, variant: "nota" };
}
