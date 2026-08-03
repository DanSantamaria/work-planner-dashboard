import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPrismaError } from "@/lib/prisma-errors";
import { requireRole } from "@/lib/api-auth";

export async function GET() {
  const { response } = await requireRole(["ADMIN", "SUPERVISOR"]);
  if (response) return response;

  try {
    const grupos = await prisma.grupo.findMany({
      orderBy: { orden: "asc" },
    });

    return NextResponse.json(grupos, { status: 200 });
  } catch (error) {
    console.error("Error al obtener grupos:", error);
    return NextResponse.json(
      { error: "No se pudieron obtener los grupos" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { response } = await requireRole(["ADMIN", "SUPERVISOR"]);
  if (response) return response;

  try {
    const body = await request.json();
    const { nombre, orden } = body;

    if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
      return NextResponse.json(
        { error: "El nombre del grupo es obligatorio" },
        { status: 400 }
      );
    }

    if (orden !== undefined && (typeof orden !== "number" || orden < 0)) {
      return NextResponse.json(
        { error: "El orden debe ser un número mayor o igual a cero" },
        { status: 400 }
      );
    }

    const grupo = await prisma.grupo.create({
      data: {
        nombre: nombre.trim(),
        ...(orden !== undefined && { orden }),
      },
    });

    return NextResponse.json(grupo, { status: 201 });
  } catch (error: unknown) {
    if (isPrismaError(error, "P2002")) {
      return NextResponse.json(
        { error: "Ya existe un grupo con ese nombre" },
        { status: 409 }
      );
    }

    console.error("Error al crear grupo:", error);
    return NextResponse.json(
      { error: "No se pudo crear el grupo" },
      { status: 500 }
    );
  }
}
