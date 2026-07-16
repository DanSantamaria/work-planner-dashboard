import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import TareasTable from "@/components/tareas/TareasTable";

export default async function TareasPage() {
  const session = await auth();
  const role = session?.user?.role;

  if (role !== "ADMIN" && role !== "SUPERVISOR") {
    redirect("/semana");
  }

  const tareas = await prisma.tarea.findMany({
    orderBy: { nombre: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tareas</h1>
      <TareasTable initialTareas={tareas} />
    </div>
  );
}
