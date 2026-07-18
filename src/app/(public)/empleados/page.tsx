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

  const empleados = await prisma.empleado.findMany({
    orderBy: { nombre: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Empleados</h1>
      <EmpleadosTable initialEmpleados={empleados} />
    </div>
  );
}
