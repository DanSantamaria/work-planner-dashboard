-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'SUPERVISOR');

-- CreateEnum
CREATE TYPE "LOB" AS ENUM ('ESPAÑA', 'FRANCIA', 'IRLANDA', 'COORDINACION', 'FIN_DE_SEMANA');

-- CreateEnum
CREATE TYPE "Turno" AS ENUM ('MANANA', 'MEDIO', 'CIERRE', 'NOCTURNO');

-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('VACACION', 'AUSENCIA', 'NOTA');

-- CreateEnum
CREATE TYPE "OrigenVacacion" AS ENUM ('ANIO_ANTERIOR', 'ANIO_ACTUAL');

-- CreateEnum
CREATE TYPE "TipoHoras" AS ENUM ('MEDICA', 'EXCESO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empleados" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "lob" "LOB" NOT NULL,
    "turno" "Turno" NOT NULL,
    "horario" TEXT NOT NULL DEFAULT '',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "diasVacaciones" INTEGER NOT NULL DEFAULT 22,
    "diasVacacionesUsados" INTEGER NOT NULL DEFAULT 0,
    "horasExceso" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "horasExcesoUsadas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "horasMedicasTotal" DOUBLE PRECISION NOT NULL DEFAULT 16,
    "horasMedicasUsadas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grupoId" TEXT,
    "ordenEnGrupo" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empleados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tareas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tareas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "semanas_plan" (
    "id" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "publicada" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "semanas_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asignaciones_semanales" (
    "id" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "oficina" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,
    "semanaId" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "tareaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asignaciones_semanales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feriados" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feriados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grupos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "grupos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "tipo" "TipoEvento" NOT NULL,
    "notas" TEXT,
    "origenVacacion" "OrigenVacacion",
    "justificada" BOOLEAN,
    "tipoHoras" "TipoHoras",
    "horas" DOUBLE PRECISION,
    "empleadoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eventos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "empleados_nombre_key" ON "empleados"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "tareas_nombre_key" ON "tareas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "semanas_plan_fechaInicio_key" ON "semanas_plan"("fechaInicio");

-- CreateIndex
CREATE UNIQUE INDEX "feriados_fecha_key" ON "feriados"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "grupos_nombre_key" ON "grupos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "eventos_empleadoId_fecha_key" ON "eventos"("empleadoId", "fecha");

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "grupos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_semanales" ADD CONSTRAINT "asignaciones_semanales_semanaId_fkey" FOREIGN KEY ("semanaId") REFERENCES "semanas_plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_semanales" ADD CONSTRAINT "asignaciones_semanales_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_semanales" ADD CONSTRAINT "asignaciones_semanales_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "tareas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

