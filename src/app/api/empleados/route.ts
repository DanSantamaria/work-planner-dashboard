import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPrismaError } from "@/lib/prisma-errors";
import { LOB, Turno } from "@/generated/prisma/client";

export async function GET() {
  try {
    const empleados = await prisma.empleado.findMany({
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json(empleados, { status: 200 });
  } catch (error) {
    console.error("Error al obtener empleados:", error);
    return NextResponse.json(
      { error: "No se pudieron obtener los empleados" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, lob, turno, horario } = body;

    if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
      return NextResponse.json(
        { error: "El nombre del empleado es obligatorio" },
        { status: 400 }
      );
    }

    if (!Object.values(LOB).includes(lob)) {
      return NextResponse.json({ error: "LOB inválido" }, { status: 400 });
    }

    if (!Object.values(Turno).includes(turno)) {
      return NextResponse.json({ error: "Turno inválido" }, { status: 400 });
    }

    const empleado = await prisma.empleado.create({
      data: {
        nombre: nombre.trim(),
        lob,
        turno,
        horario: typeof horario === "string" ? horario.trim() : "",
      },
    });

    return NextResponse.json(empleado, { status: 201 });
  } catch (error: unknown) {
    if (isPrismaError(error, "P2002")) {
      return NextResponse.json(
        { error: "Ya existe un empleado con ese nombre" },
        { status: 409 }
      );
    }

    console.error("Error al crear empleado:", error);
    return NextResponse.json(
      { error: "No se pudo crear el empleado" },
      { status: 500 }
    );
  }
}
