import { CalendarSync, CalendarDays, Users } from "lucide-react";
import Link from "next/link";

export default function Sidebar() {
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
          href="/dashboard/semana"
          className="flex items-center gap-3 px-4 py-2 rounded-lg text-white hover:bg-blue-50 hover:text-blue-600">
          <CalendarDays size={18} />
          Planificación Semanal
        </Link>
        <Link
          href="/dashboard/calendario"
          className="flex items-center gap-3 px-4 py-2 rounded-lg text-white hover:bg-blue-50 hover:text-blue-600">
          <CalendarSync size={18} />
          Calendario
        </Link>
      </nav>
    </aside>
  );
}
