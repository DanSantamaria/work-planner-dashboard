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

export type VarianteEvento = "vacacion" | "vacacionAnterior" | "ausente" | "nota";

// Independent, combinable facts about a cell — not a mutually-exclusive
// union — because a day can be both "closed" (feriado/weekend) AND have a
// personal evento on it at once (an agent working a Saturday), and both
// need to render together: gray cell, badge layered on top.
export type CeldaInfo<E extends EventoCalendario = EventoCalendario> = {
  cerrado: boolean;
  feriado: FeriadoCalendario | null;
  finDeSemana: boolean;
  evento: { data: E; variant: VarianteEvento } | null;
};

function mismaFecha(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

export function esFinDeSemana(fecha: Date): boolean {
  const dia = fecha.getDay();
  return dia === 0 || dia === 6;
}

function resolverVarianteEvento(evento: EventoCalendario): VarianteEvento {
  if (evento.tipo === "VACACION") {
    return evento.origenVacacion === "ANIO_ANTERIOR"
      ? "vacacionAnterior"
      : "vacacion";
  }

  if (evento.tipo === "AUSENCIA") {
    return "ausente";
  }

  return "nota";
}

/**
 * What a single (fecha, empleado) calendar cell should show. feriado/
 * finDeSemana and evento are independent — a personal evento never hides
 * the closed status, since some agents work those days: the cell renders
 * gray (cerrado) with the evento's badge/dot on top of it, not one or the
 * other.
 */
export function resolverCelda<E extends EventoCalendario>(
  fecha: Date,
  empleadoId: string,
  eventos: E[],
  feriados: FeriadoCalendario[]
): CeldaInfo<E> {
  const feriado =
    feriados.find((f) => mismaFecha(new Date(f.fecha), fecha)) ?? null;
  const finDeSemana = esFinDeSemana(fecha);

  const eventoEncontrado = eventos.find(
    (e) => e.empleadoId === empleadoId && mismaFecha(new Date(e.fecha), fecha)
  );

  return {
    cerrado: feriado !== null || finDeSemana,
    feriado,
    finDeSemana,
    evento: eventoEncontrado
      ? { data: eventoEncontrado, variant: resolverVarianteEvento(eventoEncontrado) }
      : null,
  };
}
