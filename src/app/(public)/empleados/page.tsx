import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import EmpleadosTable from "@/components/empleados/EmpleadosTable";

export default async function EmpleadosPage() {
  const session = await auth();
  const role = session?.user?.role;

  if (role !== "ADMIN" && role !== "SUPERVISOR") {
    redirect("/semana");
  }

  const [empleados, grupos] = await Promise.all([
    prisma.empleado.findMany({
      orderBy: { nombre: "asc" },
      include: { grupo: { select: { id: true, nombre: true, orden: true } } },
    }),
    prisma.grupo.findMany({ orderBy: { orden: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Empleados</h1>
      <EmpleadosTable initialEmpleados={empleados} initialGrupos={grupos} />
    </div>
  );
}
