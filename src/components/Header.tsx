"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Settings, LogOut, Search } from "lucide-react";
import type { Role } from "@/generated/prisma/browser";
import { useBusqueda } from "@/context/BusquedaContext";
import { useClickOutside } from "@/hooks/useClickOutside";

type HeaderUser = {
  name?: string | null;
  role: Role;
};

const SEARCH_PLACEHOLDERS: Record<string, string> = {
  "/semana": "Buscar empleado o tarea...",
  "/empleados": "Buscar empleado...",
  "/tareas": "Buscar tarea...",
  "/usuarios": "Buscar usuario...",
};

export default function Header({ user }: { user: HeaderUser | null }) {
  const { busqueda, setBusqueda } = useBusqueda();
  const [mostrarPopover, setMostrarPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useClickOutside(popoverRef, () => setMostrarPopover(false));

  useEffect(() => {
    setBusqueda("");
  }, [pathname, setBusqueda]);

  const searchPlaceholder = Object.entries(SEARCH_PLACEHOLDERS).find(
    ([path]) => pathname.startsWith(path)
  )?.[1];

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b bg-white px-8">
      <p className="shrink-0 text-4xl font-bold text-gray-800">Bienvenido</p>

      <div className="max-w-md flex-1">
        {searchPlaceholder && (
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sidebar"
            />
          </div>
        )}
      </div>

      {user ? (
        <div className="flex shrink-0 items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-bold text-gray-800">{user.name}</p>
            <p className="text-xs text-gray-400">{user.role}</p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex cursor-pointer items-center gap-2 text-gray-500 hover:text-red-500"
          >
            <LogOut size={18} />
          </button>
        </div>
      ) : (
        <div ref={popoverRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMostrarPopover((prev) => !prev)}
            className="cursor-pointer text-gray-500 hover:text-gray-700"
          >
            <Settings size={22} />
          </button>

          {mostrarPopover && (
            <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-gray-200 bg-white p-2 text-sm shadow-lg">
              <Link
                href="/login"
                className="block rounded-lg bg-accent px-4 py-2 text-center font-medium text-white hover:opacity-90"
              >
                Iniciar Sesión
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
