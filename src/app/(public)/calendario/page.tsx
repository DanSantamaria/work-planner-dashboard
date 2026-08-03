import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ordenarEmpleados } from "@/lib/orden-empleados";
import BalanceTable from "@/components/calendario/BalanceTable";
import Leyenda from "@/components/calendario/Leyenda";
import CalendarioView from "@/components/calendario/CalendarioView";

export default async function CalendarioPage() {
  const session = await auth();
  const role = session?.user?.role;
  const isStaff = role === "ADMIN" || role === "SUPERVISOR";

  const empleadosSinOrdenar = await prisma.empleado.findMany({
    where: { activo: true },
    select: {
      id: true,
      nombre: true,
      lob: true,
      horario: true,
      grupoId: true,
      ordenEnGrupo: true,
      grupo: { select: { id: true, nombre: true, orden: true } },
      diasVacaciones: true,
      diasVacacionesUsados: true,
      horasExceso: true,
      horasExcesoUsadas: true,
      horasMedicasTotal: true,
      horasMedicasUsadas: true,
    },
  });

  const empleados = ordenarEmpleados(empleadosSinOrdenar);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Calendario</h1>
      <div className="mb-6">
        <Leyenda />
      </div>
      <div className="mb-8">
        <CalendarioView empleados={empleados} isStaff={isStaff} />
      </div>
      <BalanceTable initialEmpleados={empleados} isStaff={isStaff} />
    </div>
  );
}
