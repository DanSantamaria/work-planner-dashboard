"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import type { Role } from "@/generated/prisma/client";

type HeaderUser = {
  name?: string | null;
  role: Role;
};

export default function Header({ user }: { user: HeaderUser | null }) {
  if (!user) {
    return (
      <header className="h-16 bg-white border-b flex items-center justify-between px-8">
        <p className="text-gray-600">Bienvenido</p>
        <Link
          href="/login"
          className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600"
        >
          Iniciar Sesión
        </Link>
      </header>
    );
  }

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-8">
      <div />

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-800">{user.name}</p>
          <p className="text-xs text-gray-400">{user.role}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 text-gray-500 hover:text-red-500 cursor-pointer"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
