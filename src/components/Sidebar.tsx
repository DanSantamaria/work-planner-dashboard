import {
  CalendarSync,
  CalendarDays,
  Users,
  UserCog,
  ListChecks,
} from "lucide-react";
import Link from "next/link";
import type { Role } from "@/generated/prisma/client";

export default function Sidebar({ role }: { role?: Role }) {
  return (
    <aside className="w-64 bg-blue-600 shadow-md flex flex-col">
      {/* Logo / App name */}
      <div className="p-6 border-b flex items-center gap-3">
        <CalendarSync className="text-white" size={40} />
        <div>
          <h1 className="text-xl font-bold text-white">CAC Dashboard</h1>
          <p className="text-xs text-white">Planificador</p>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 p-4 flex flex-col gap-2">
        <Link
          href="/semana"
          className="flex items-center gap-3 px-4 py-2 rounded-lg text-white hover:bg-blue-50 hover:text-blue-600">
          <CalendarDays size={18} />
          Planificación Semanal
        </Link>
        <Link
          href="/calendario"
          className="flex items-center gap-3 px-4 py-2 rounded-lg text-white hover:bg-blue-50 hover:text-blue-600">
          <CalendarSync size={18} />
          Calendario
        </Link>

        {(role === "ADMIN" || role === "SUPERVISOR") && (
          <Link
            href="/empleados"
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-white hover:bg-blue-50 hover:text-blue-600">
            <Users size={18} />
            Empleados
          </Link>
        )}

        {(role === "ADMIN" || role === "SUPERVISOR") && (
          <Link
            href="/tareas"
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-white hover:bg-blue-50 hover:text-blue-600">
            <ListChecks size={18} />
            Tareas
          </Link>
        )}

        {role === "ADMIN" && (
          <Link
            href="/usuarios"
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-white hover:bg-blue-50 hover:text-blue-600">
            <UserCog size={18} />
            Usuarios
          </Link>
        )}
      </nav>
    </aside>
  );
}
