"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import type { Role } from "@/generated/prisma/browser";

type ShellUser = {
  name?: string | null;
  role: Role;
};

// Holds the one piece of state the shell needs on phones — whether the
// sidebar drawer is open — which is why it exists at all: the (public)
// layout is a server component and can't own state. Everything else stays
// exactly where it was.
export default function Shell({
  user,
  children,
}: {
  user: ShellUser | null;
  children: React.ReactNode;
}) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    // h-dvh, not h-screen: on a phone `vh` measures the viewport as it would
    // be with the browser's URL bar hidden, so 100vh is taller than what the
    // user can actually see. `dvh` measures what is visible right now.
    <div className="flex h-dvh bg-page">
      <Sidebar
        user={user}
        abierto={menuAbierto}
        onCerrar={() => setMenuAbierto(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header user={user} onAbrirMenu={() => setMenuAbierto(true)} />
        {/* Padding sits on the inner div, not on <main>: <main> is the scroll
            container, and a sticky table header offsets from its padding
            edge — leaving it here would park every sticky header below the
            top bar, with rows visible in the gap. */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
