-- CreateEnum
CREATE TYPE "AccionHistorial" AS ENUM ('CREAR', 'EDITAR', 'ELIMINAR');

-- CreateEnum
CREATE TYPE "CategoriaHistorial" AS ENUM ('EVENTO', 'SALDO');

-- CreateTable
CREATE TABLE "historial_calendario" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoria" "CategoriaHistorial" NOT NULL,
    "accion" "AccionHistorial" NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "usuarioNombre" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "empleadoNombre" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3),
    "fechaFin" TIMESTAMP(3),
    "tipoEvento" "TipoEvento",
    "dias" INTEGER,
    "cambios" JSONB NOT NULL,
    "saldos" JSONB,

    CONSTRAINT "historial_calendario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "historial_calendario_createdAt_idx" ON "historial_calendario"("createdAt");

-- CreateIndex
CREATE INDEX "historial_calendario_empleadoId_idx" ON "historial_calendario"("empleadoId");
