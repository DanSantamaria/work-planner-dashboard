"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  ClockPlus,
  CalendarRange,
  Users,
  UserCog,
  ListChecks,
  PanelLeftClose,
  PanelRightClose,
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
  Icon: typeof ClockPlus;
  roles: Role[] | null;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/semana", label: "Organización Semanal", Icon: ClockPlus, roles: null },
  { href: "/calendario", label: "Calendario", Icon: CalendarRange, roles: null },
  { href: "/empleados", label: "Empleados", Icon: Users, roles: ["ADMIN", "SUPERVISOR"] },
  { href: "/tareas", label: "Tareas", Icon: ListChecks, roles: ["ADMIN", "SUPERVISOR"] },
  { href: "/usuarios", label: "Usuarios", Icon: UserCog, roles: ["ADMIN"] },
];

type Props = {
  user: SidebarUser | null;
  /** Drawer state — only meaningful below `md`, where the sidebar is an
      overlay instead of a column. */
  abierto: boolean;
  onCerrar: () => void;
};

export default function Sidebar({ user, abierto, onCerrar }: Props) {
  const [expandido, setExpandido] = useState(false);
  const [mostrarPopover, setMostrarPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useClickOutside(popoverRef, () => setMostrarPopover(false));

  useEffect(() => {
    if (!abierto) return;

    function alPresionar(e: KeyboardEvent) {
      if (e.key === "Escape") onCerrar();
    }

    document.addEventListener("keydown", alPresionar);
    return () => document.removeEventListener("keydown", alPresionar);
  }, [abierto, onCerrar]);

  // Click-to-expand belongs to the desktop column. As a drawer the same
  // handler would read as "closes when you brush it", which with a finger
  // happens constantly — so it is checked at click time rather than tracked
  // in state.
  function alternarExpandidoEnEscritorio() {
    if (!window.matchMedia("(min-width: 768px)").matches) return;
    setExpandido((prev) => !prev);
  }

  const navItems = NAV_ITEMS.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <>
      {/* Backdrop, phones only: gives the drawer something to close against
          and dims what is behind it. */}
      {abierto && (
        <div
          onClick={onCerrar}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          aria-hidden
        />
      )}

      <aside
        onClick={alternarExpandidoEnEscritorio}
        // Two presentations of one element. Below md: an overlay drawer,
        // parked off-screen (-translate-x-full) until opened. From md up: the
        // column it has always been — relative + z-40 keeps the whole sidebar
        // above page content, since the calendar's sticky cells declare
        // z-10/z-20 and would otherwise paint over the Ajustes popover.
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-shrink-0 cursor-pointer flex-col bg-sidebar transition-transform duration-200 md:relative md:z-40 md:translate-x-0 md:transition-all ${
          abierto ? "translate-x-0" : "-translate-x-full"
        } ${expandido ? "md:w-64" : "md:w-16"}`}
      >
        <div className="flex items-center gap-3 p-4">
          <Image
            src="/LogoCACDashboard.svg"
            alt="CAC Dashboard"
            width={40}
            height={40}
            className="shrink-0"
          />
          {/* Visible in the drawer always; on the desktop column only when
              expanded. Done with a class, not a condition, so resizing between
              the two presentations can't leave a label stranded. */}
          <span
            className={`whitespace-nowrap text-lg font-bold text-white ${
              expandido ? "" : "md:hidden"
            }`}
          >
            CAC Dashboard
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            // Same arrow, two jobs: on a phone it closes the drawer, on the
            // desktop column it collapses it.
            if (!window.matchMedia("(min-width: 768px)").matches) {
              onCerrar();
              return;
            }
            setExpandido((prev) => !prev);
          }}
          className={`flex cursor-pointer items-center justify-end border-y border-white/10 px-4 py-2 text-gray-400 hover:text-white ${
            expandido ? "md:justify-end md:px-4" : "md:justify-center md:px-0"
          }`}
        >
          <PanelLeftClose size={18} className={expandido ? "" : "md:hidden"} />
          <PanelRightClose
            size={18}
            className={expandido ? "hidden" : "hidden md:block"}
          />
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
                onClick={onCerrar}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                  activo
                    ? "text-accent"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                <Icon size={20} className="shrink-0" />
                <span
                  className={`whitespace-nowrap text-sm ${
                    expandido ? "" : "md:hidden"
                  }`}
                >
                  {label}
                </span>
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
            <span className={`text-sm ${expandido ? "" : "md:hidden"}`}>
              Ajustes
            </span>
          </button>

          {mostrarPopover && (
            <div className="absolute bottom-full left-2 z-50 mb-2 w-56 rounded-lg border border-gray-200 bg-white p-3 text-sm shadow-lg">
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
                  className="block rounded-lg bg-accent px-4 py-2 text-center font-medium text-white hover:opacity-90"
                >
                  Iniciar Sesión
                </Link>
              )}
            </div>
          )}
          </div>
      </aside>
    </>
  );
}
