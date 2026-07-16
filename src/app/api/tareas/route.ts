import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPrismaError } from "@/lib/prisma-errors";

export async function GET() {
  try {
    const tareas = await prisma.tarea.findMany({
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json(tareas, { status: 200 });
  } catch (error) {
    console.error("Error al obtener tareas:", error);
    return NextResponse.json(
      { error: "No se pudieron obtener las tareas" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, descripcion } = body;

    if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
      return NextResponse.json(
        { error: "El nombre de la tarea es obligatorio" },
        { status: 400 }
      );
    }

    const tarea = await prisma.tarea.create({
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
      },
    });

    return NextResponse.json(tarea, { status: 201 });
  } catch (error: unknown) {
    if (isPrismaError(error, "P2002")) {
      return NextResponse.json(
        { error: "Ya existe una tarea con ese nombre" },
        { status: 409 }
      );
    }

    console.error("Error al crear tarea:", error);
    return NextResponse.json(
      { error: "No se pudo crear la tarea" },
      { status: 500 }
    );
  }
}
