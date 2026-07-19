import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isPrismaError } from "@/lib/prisma-errors";
import { Role } from "@/generated/prisma/client";
import { requireRole } from "@/lib/api-auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PUBLIC_USER_FIELDS = {
  id: true,
  nombre: true,
  email: true,
  role: true,
} as const;

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, { params }: RouteContext) {
  const { response } = await requireRole(["ADMIN"]);
  if (response) return response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { nombre, email, role, password } = body;

    if (
      nombre !== undefined &&
      (typeof nombre !== "string" || !nombre.trim())
    ) {
      return NextResponse.json(
        { error: "El nombre no puede estar vacío" },
        { status: 400 }
      );
    }

    if (
      email !== undefined &&
      (typeof email !== "string" || !EMAIL_REGEX.test(email.trim()))
    ) {
      return NextResponse.json(
        { error: "El email no es válido" },
        { status: 400 }
      );
    }

    if (role !== undefined && !Object.values(Role).includes(role)) {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
    }

    if (
      password !== undefined &&
      (typeof password !== "string" || password.length < 6)
    ) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    const hashedPassword =
      password !== undefined ? await bcrypt.hash(password, 10) : undefined;

    const usuario = await prisma.user.update({
      where: { id },
      data: {
        ...(nombre !== undefined && { nombre: nombre.trim() }),
        ...(email !== undefined && { email: email.trim().toLowerCase() }),
        ...(role !== undefined && { role }),
        ...(hashedPassword !== undefined && { password: hashedPassword }),
      },
      select: PUBLIC_USER_FIELDS,
    });

    return NextResponse.json(usuario, { status: 200 });
  } catch (error: unknown) {
    if (isPrismaError(error, "P2025")) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    if (isPrismaError(error, "P2002")) {
      return NextResponse.json(
        { error: "Ya existe un usuario con ese email" },
        { status: 409 }
      );
    }

    console.error("Error al actualizar usuario:", error);
    return NextResponse.json(
      { error: "No se pudo actualizar el usuario" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { session, response } = await requireRole(["ADMIN"]);
  if (response) return response;

  try {
    const { id } = await params;

    if (session?.user?.id === id) {
      return NextResponse.json(
        { error: "No puedes eliminar tu propio usuario" },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    if (isPrismaError(error, "P2025")) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    console.error("Error al eliminar usuario:", error);
    return NextResponse.json(
      { error: "No se pudo eliminar el usuario" },
      { status: 500 }
    );
  }
}
