import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DIAS_RETENCION, fechaLimiteRetencion } from "@/lib/historial";
import {
  ETIQUETA_ACCION,
  comoCambios,
  etiquetaCampo,
  etiquetaTipoEvento,
  etiquetaValor,
  formatearMomento,
  formatearPeriodo,
  formatearSaldo,
  SALDOS_MOSTRADOS,
} from "@/lib/historial-formato";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";

const POR_PAGINA = 25;
const ACCIONES = ["CREAR", "EDITAR", "ELIMINAR"] as const;
type Accion = (typeof ACCIONES)[number];

type SearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

// A query-string value can be a string, a list, or missing; we only want one.
function uno(valor: string | string[] | undefined): string {
  return (Array.isArray(valor) ? valor[0] : valor) ?? "";
}

function fechaValida(valor: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(valor) && !isNaN(new Date(valor).getTime());
}

const VARIANTE_ACCION = {
  CREAR: "success",
  EDITAR: "warning",
  ELIMINAR: "ausente",
} as const;

const VARIANTE_TIPO = {
  VACACION: "vacacion",
  AUSENCIA: "ausente",
  NOTA: "nota",
} as const;

// Same look as the shared <Input> (used for the date fields below), so the
// selects and the dates line up. min-w-0 lets a field shrink to its grid
// column instead of overflowing into its neighbour.
const CLASE_CAMPO =
  "w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-sidebar";

export default async function HistorialPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  const role = session?.user?.role;

  if (role !== "ADMIN" && role !== "SUPERVISOR") {
    redirect("/semana");
  }

  const params = await searchParams;
  const empleadoId = uno(params.empleado);
  const usuarioId = uno(params.usuario);
  const accionParam = uno(params.accion);
  const desde = uno(params.desde);
  const hasta = uno(params.hasta);
  const pagina = Math.max(1, parseInt(uno(params.pagina), 10) || 1);

  const accion: Accion | "" = (ACCIONES as readonly string[]).includes(
    accionParam
  )
    ? (accionParam as Accion)
    : "";

  // Never show anything past the retention window, even if it hasn't been
  // purged yet. A "desde" filter can only narrow that window, not widen it.
  const limite = fechaLimiteRetencion();
  const desdeFecha = fechaValida(desde)
    ? new Date(`${desde}T00:00:00.000Z`)
    : null;
  const inicio = desdeFecha && desdeFecha > limite ? desdeFecha : limite;
  const fin = fechaValida(hasta) ? new Date(`${hasta}T23:59:59.999Z`) : null;

  const where = {
    createdAt: { gte: inicio, ...(fin && { lte: fin }) },
    ...(empleadoId && { empleadoId }),
    ...(usuarioId && { usuarioId }),
    ...(accion && { accion }),
  };

  const [registros, total, empleados, usuarios] = await Promise.all([
    prisma.historialCalendario.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
    }),
    prisma.historialCalendario.count({ where }),
    prisma.empleado.findMany({
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    }),
    prisma.historialCalendario.findMany({
      where: { createdAt: { gte: limite } },
      distinct: ["usuarioId"],
      orderBy: { usuarioNombre: "asc" },
      select: { usuarioId: true, usuarioNombre: true },
    }),
  ]);

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  // Page links keep whatever filters are active.
  function hrefPagina(n: number): string {
    const q = new URLSearchParams();
    if (empleadoId) q.set("empleado", empleadoId);
    if (usuarioId) q.set("usuario", usuarioId);
    if (accion) q.set("accion", accion);
    if (fechaValida(desde)) q.set("desde", desde);
    if (fechaValida(hasta)) q.set("hasta", hasta);
    if (n > 1) q.set("pagina", String(n));
    const texto = q.toString();
    return texto ? `/historial?${texto}` : "/historial";
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Historial</h1>
      <p className="mb-6 text-sm text-gray-500">
        Cambios hechos en el calendario. Se conservan los últimos{" "}
        {DIAS_RETENCION} días.
      </p>

      {/* A plain GET form: pressing "Filtrar" reloads the page with the
          choices in the URL, so filtered views can be bookmarked or shared
          and no client-side code is needed. */}
      <form
        method="get"
        className="mb-6 grid gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5"
      >
        <label className="min-w-0 text-sm font-medium text-gray-700">
          Empleado
          <select
            name="empleado"
            defaultValue={empleadoId}
            className={`mt-1 ${CLASE_CAMPO}`}
          >
            <option value="">Todos</option>
            {empleados.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="min-w-0 text-sm font-medium text-gray-700">
          Hecho por
          <select
            name="usuario"
            defaultValue={usuarioId}
            className={`mt-1 ${CLASE_CAMPO}`}
          >
            <option value="">Todos</option>
            {usuarios.map((u) => (
              <option key={u.usuarioId} value={u.usuarioId}>
                {u.usuarioNombre}
              </option>
            ))}
          </select>
        </label>

        <label className="min-w-0 text-sm font-medium text-gray-700">
          Acción
          <select
            name="accion"
            defaultValue={accion}
            className={`mt-1 ${CLASE_CAMPO}`}
          >
            <option value="">Todas</option>
            {ACCIONES.map((a) => (
              <option key={a} value={a}>
                {ETIQUETA_ACCION[a]}
              </option>
            ))}
          </select>
        </label>

        <Input
          type="date"
          label="Desde"
          name="desde"
          defaultValue={fechaValida(desde) ? desde : ""}
          wrapperClassName="min-w-0"
          className="min-w-0"
        />

        <Input
          type="date"
          label="Hasta"
          name="hasta"
          defaultValue={fechaValida(hasta) ? hasta : ""}
          wrapperClassName="min-w-0"
          className="min-w-0"
        />

        <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3 2xl:col-span-5">
          <button
            type="submit"
            className="cursor-pointer rounded-lg bg-sidebar px-4 py-2 text-sm text-white hover:opacity-90"
          >
            Filtrar
          </button>
          <Link
            href="/historial"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Limpiar filtros
          </Link>
        </div>
      </form>

      {registros.length === 0 ? (
        <p className="text-gray-500">
          No hay cambios registrados con estos filtros.
        </p>
      ) : (
        <Table>
          <TableHead>
            <TableHeaderCell>Fecha y hora</TableHeaderCell>
            <TableHeaderCell>Hecho por</TableHeaderCell>
            <TableHeaderCell>Acción</TableHeaderCell>
            <TableHeaderCell>Empleado</TableHeaderCell>
            <TableHeaderCell>Qué</TableHeaderCell>
            <TableHeaderCell>Cambios</TableHeaderCell>
            <TableHeaderCell>Saldos</TableHeaderCell>
          </TableHead>
          <TableBody>
            {registros.map((r, i) => {
              const cambios = comoCambios(r.cambios);
              const saldos = comoCambios(r.saldos);

              return (
                <TableRow key={r.id} index={i} className="align-top">
                  <TableCell className="whitespace-nowrap">
                    {formatearMomento(r.createdAt)}
                  </TableCell>
                  <TableCell>{r.usuarioNombre}</TableCell>
                  <TableCell>
                    <Badge variant={VARIANTE_ACCION[r.accion]}>
                      {ETIQUETA_ACCION[r.accion]}
                    </Badge>
                  </TableCell>
                  <TableCell>{r.empleadoNombre}</TableCell>
                  <TableCell>
                    {r.categoria === "EVENTO" ? (
                      <div className="flex flex-col items-start gap-1">
                        {r.tipoEvento && (
                          <Badge variant={VARIANTE_TIPO[r.tipoEvento]}>
                            {etiquetaTipoEvento(r.tipoEvento)}
                          </Badge>
                        )}
                        <span className="whitespace-nowrap text-xs text-gray-600">
                          {formatearPeriodo(r.fechaInicio, r.fechaFin, r.dias)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-600">Saldo manual</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <LineasCambio cambios={cambios} accion={r.accion} />
                  </TableCell>
                  <TableCell>
                    <BloquesSaldo saldos={saldos} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {totalPaginas > 1 && (
        <nav
          aria-label="Paginación"
          className="mt-4 flex items-center justify-between text-sm text-gray-600"
        >
          {pagina > 1 ? (
            <Link href={hrefPagina(pagina - 1)} className="hover:underline">
              ← Anterior
            </Link>
          ) : (
            <span className="text-gray-300">← Anterior</span>
          )}
          <span>
            Página {pagina} de {totalPaginas} · {total} cambios
          </span>
          {pagina < totalPaginas ? (
            <Link href={hrefPagina(pagina + 1)} className="hover:underline">
              Siguiente →
            </Link>
          ) : (
            <span className="text-gray-300">Siguiente →</span>
          )}
        </nav>
      )}
    </div>
  );
}

// One line per field: "Tipo: Vacaciones → Ausencia". A created record only
// has a "new" side and a deleted one only an "old" side, so those show a
// single value instead of an arrow.
function LineasCambio({
  cambios,
  accion,
}: {
  cambios: ReturnType<typeof comoCambios>;
  accion: string;
}) {
  if (cambios.length === 0) return <span className="text-gray-400">—</span>;

  return (
    <ul className="flex flex-col gap-0.5 text-xs text-gray-700">
      {cambios.map((c) => (
        <li key={c.campo}>
          <span className="font-medium">{etiquetaCampo(c.campo)}:</span>{" "}
          {accion === "CREAR"
            ? etiquetaValor(c.campo, c.nuevo)
            : accion === "ELIMINAR"
              ? etiquetaValor(c.campo, c.anterior)
              : `${etiquetaValor(c.campo, c.anterior)} → ${etiquetaValor(c.campo, c.nuevo)}`}
        </li>
      ))}
    </ul>
  );
}

// "Saldos" column: for each balance that changed, the balance the employee had
// before and the one they have now — e.g. "Saldo anterior: 10 días / Nuevo
// saldo: 9 días". Rows saved by the first version of the history stored the
// "used" counters instead; those fall back to a plain before → after line.
function BloquesSaldo({ saldos }: { saldos: ReturnType<typeof comoCambios> }) {
  const conocidos = SALDOS_MOSTRADOS.flatMap((s) => {
    const cambio = saldos.find((c) => c.campo === s.campo);
    return cambio ? [{ ...s, cambio }] : [];
  });
  const antiguos = saldos.filter(
    (c) => !SALDOS_MOSTRADOS.some((s) => s.campo === c.campo)
  );

  if (conocidos.length === 0 && antiguos.length === 0) {
    return <span className="text-gray-400">—</span>;
  }

  return (
    <div className="flex flex-col gap-2 text-xs text-gray-700">
      {conocidos.map(({ campo, unidad, cambio }) => (
        <div key={campo}>
          <div className="font-medium">{etiquetaCampo(campo)}</div>
          <div>
            Saldo anterior:{" "}
            <span className="font-semibold">
              {formatearSaldo(cambio.anterior, unidad)}
            </span>
          </div>
          <div>
            Nuevo saldo:{" "}
            <span className="font-semibold">
              {formatearSaldo(cambio.nuevo, unidad)}
            </span>
          </div>
        </div>
      ))}
      {antiguos.length > 0 && (
        <LineasCambio cambios={antiguos} accion="EDITAR" />
      )}
    </div>
  );
}
