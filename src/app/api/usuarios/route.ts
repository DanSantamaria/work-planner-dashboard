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

export async function GET() {
  const { response } = await requireRole(["ADMIN"]);
  if (response) return response;

  try {
    const usuarios = await prisma.user.findMany({
      select: PUBLIC_USER_FIELDS,
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json(usuarios, { status: 200 });
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return NextResponse.json(
      { error: "No se pudieron obtener los usuarios" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { response } = await requireRole(["ADMIN"]);
  if (response) return response;

  try {
    const body = await request.json();
    const { nombre, email, role, password } = body;

    if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
      return NextResponse.json(
        { error: "El nombre es obligatorio" },
        { status: 400 }
      );
    }

    if (
      !email ||
      typeof email !== "string" ||
      !EMAIL_REGEX.test(email.trim())
    ) {
      return NextResponse.json(
        { error: "El email no es válido" },
        { status: 400 }
      );
    }

    if (!Object.values(Role).includes(role)) {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const usuario = await prisma.user.create({
      data: {
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        role,
        password: hashedPassword,
      },
      select: PUBLIC_USER_FIELDS,
    });

    return NextResponse.json(usuario, { status: 201 });
  } catch (error: unknown) {
    if (isPrismaError(error, "P2002")) {
      return NextResponse.json(
        { error: "Ya existe un usuario con ese email" },
        { status: 409 }
      );
    }

    console.error("Error al crear usuario:", error);
    return NextResponse.json(
      { error: "No se pudo crear el usuario" },
      { status: 500 }
    );
  }
}
