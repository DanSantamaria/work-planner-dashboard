"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  CalendarDays,
  Calendar,
  Users,
  UserCog,
  ListChecks,
  ChevronLeft,
  ChevronRight,
  Settings,
  LogOut,
} from "lucide-react";
import type { Role } from "@/generated/prisma/browser";
import { useClickOutside } from "@/hooks/useClickOutside";

type SidebarUser = {
  name?: string | null;
  role: Role;
};

type NavItem = {
  href: string;
  label: string;
  Icon: typeof CalendarDays;
  roles: Role[] | null;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/semana", label: "Organización Semanal", Icon: CalendarDays, roles: null },
  { href: "/calendario", label: "Calendario", Icon: Calendar, roles: null },
  { href: "/empleados", label: "Empleados", Icon: Users, roles: ["ADMIN", "SUPERVISOR"] },
  { href: "/tareas", label: "Tareas", Icon: ListChecks, roles: ["ADMIN", "SUPERVISOR"] },
  { href: "/usuarios", label: "Usuarios", Icon: UserCog, roles: ["ADMIN"] },
];

export default function Sidebar({ user }: { user: SidebarUser | null }) {
  const [expandido, setExpandido] = useState(false);
  const [mostrarPopover, setMostrarPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useClickOutside(popoverRef, () => setMostrarPopover(false));

  const navItems = NAV_ITEMS.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <aside
      onClick={() => setExpandido((prev) => !prev)}
      className={`flex flex-shrink-0 cursor-pointer flex-col bg-[#211E2F] transition-all duration-200 ${
        expandido ? "w-64" : "w-16"
      }`}
    >
      <div className="flex items-center gap-3 p-4">
        <Image
          src="/LogoCACDashboard.svg"
          alt="CAC Dashboard"
          width={40}
          height={40}
          className="shrink-0"
        />
        {expandido && (
          <span className="whitespace-nowrap text-lg font-bold text-white">
            CAC Dashboard
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setExpandido((prev) => !prev);
        }}
        className="flex cursor-pointer items-center justify-center border-y border-white/10 py-2 text-gray-400 hover:text-white"
      >
        {expandido ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>

      <nav
        onClick={(e) => e.stopPropagation()}
        className="flex flex-1 flex-col gap-1 p-2 pt-4"
      >
        {navItems.map(({ href, label, Icon }) => {
          const activo = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                activo
                  ? "text-[#E9865C]"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              <Icon size={20} className="shrink-0" />
              {expandido && (
                <span className="whitespace-nowrap text-sm">{label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div
        ref={popoverRef}
        onClick={(e) => e.stopPropagation()}
        className="relative border-t border-white/10 p-2"
      >
        <button
          type="button"
          onClick={() => setMostrarPopover((prev) => !prev)}
          className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-gray-300 hover:text-white"
        >
          <Settings size={20} className="shrink-0" />
          {expandido && <span className="text-sm">Ajustes</span>}
        </button>

        {mostrarPopover && (
          <div className="absolute bottom-full left-2 mb-2 w-56 rounded-lg border border-gray-200 bg-white p-3 text-sm shadow-lg">
            {user ? (
              <>
                <p className="font-bold text-gray-800">{user.name}</p>
                <p className="mb-3 text-xs text-gray-400">{user.role}</p>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-red-500 hover:bg-red-50"
                >
                  <LogOut size={16} />
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="block rounded-lg bg-[#E9865C] px-4 py-2 text-center font-medium text-white hover:opacity-90"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
