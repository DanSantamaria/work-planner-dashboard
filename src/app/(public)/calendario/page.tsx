import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import BalanceTable from "@/components/calendario/BalanceTable";
import Leyenda from "@/components/calendario/Leyenda";

export default async function CalendarioPage() {
  const session = await auth();
  const role = session?.user?.role;
  const isStaff = role === "ADMIN" || role === "SUPERVISOR";

  const empleados = await prisma.empleado.findMany({
    where: { activo: true },
    orderBy: [
      { grupo: { orden: "asc" } },
      { ordenEnGrupo: "asc" },
      { nombre: "asc" },
    ],
    select: {
      id: true,
      nombre: true,
      diasVacaciones: true,
      diasVacacionesUsados: true,
      horasExceso: true,
      horasExcesoUsadas: true,
      horasMedicasTotal: true,
      horasMedicasUsadas: true,
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Calendario</h1>
      <div className="mb-6">
        <Leyenda />
      </div>
      <BalanceTable initialEmpleados={empleados} isStaff={isStaff} />
    </div>
  );
}
