import { NextResponse } from "next/server";
import { auth } from "@/auth";
import type { Role } from "@/generated/prisma/client";

export async function requireRole(allowedRoles: Role[]) {
  const session = await auth();
  const role = session?.user?.role;

  if (!role || !allowedRoles.includes(role)) {
    return {
      session: null,
      response: NextResponse.json({ error: "No autorizado" }, { status: 403 }),
    };
  }

  return { session, response: null };
}
