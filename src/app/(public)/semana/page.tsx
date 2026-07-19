import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import SemanaView from "@/components/semana/SemanaView";

export default async function SemanaPage() {
  const session = await auth();
  const role = session?.user?.role;
  const canEdit = role === "ADMIN" || role === "SUPERVISOR";
  const isAdmin = role === "ADMIN";

  const [semanas, empleados, tareas] = await Promise.all([
    prisma.semanaPlan.findMany({
      where: canEdit ? {} : { publicada: true },
      orderBy: { fechaInicio: "asc" },
      include: {
        asignaciones: {
          include: {
            tarea: { select: { id: true, nombre: true } },
          },
        },
      },
    }),
    prisma.empleado.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.tarea.findMany({
      where: { activa: true },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    }),
  ]);

  const hoy = new Date();

  const semanaInicial =
    semanas.length === 0
      ? null
      : (semanas.find((s) => s.fechaInicio <= hoy && hoy <= s.fechaFin) ??
        semanas.reduce((masCercana, actual) => {
          const diffActual = Math.abs(
            actual.fechaInicio.getTime() - hoy.getTime()
          );
          const diffMasCercana = Math.abs(
            masCercana.fechaInicio.getTime() - hoy.getTime()
          );
          return diffActual < diffMasCercana ? actual : masCercana;
        }));

  const semanasSerializadas = semanas.map((s) => ({
    id: s.id,
    fechaInicio: s.fechaInicio.toISOString(),
    fechaFin: s.fechaFin.toISOString(),
    publicada: s.publicada,
    asignaciones: s.asignaciones,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Planificación Semanal
      </h1>
      <SemanaView
        semanasIniciales={semanasSerializadas}
        semanaInicialId={semanaInicial?.id ?? null}
        empleadosIniciales={empleados}
        tareasDisponibles={tareas}
        canEdit={canEdit}
        isAdmin={isAdmin}
      />
    </div>
  );
}
