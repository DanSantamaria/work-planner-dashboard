import type { ReactNode } from "react";

type BadgeVariant =
  | "default"
  | "oficina"
  | "ausente"
  | "recepcion"
  | "success"
  | "warning"
  | "tarea"
  | "vacacion"
  | "vacacionAnterior"
  | "nota"
  | "feriado";

type Props = {
  variant?: BadgeVariant;
  bold?: boolean;
  children: ReactNode;
};

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: "bg-gray-200 text-gray-500 rounded-full",
  oficina: "bg-oficina-bg text-oficina-text border border-oficina-text rounded-md",
  ausente: "bg-ausente-bg text-ausente-text border border-ausente-text rounded-md",
  recepcion: "bg-recepcion-bg text-recepcion-text border border-recepcion-text rounded-md",
  success: "bg-green-100 text-green-700 rounded-full",
  warning: "bg-amber-100 text-amber-700 rounded-full",
  tarea: "bg-gray-50 border text-gray-700 rounded-xl my-0.4",
  vacacion: "bg-vacacion-bg text-vacacion-text border border-vacacion-text rounded-md",
  vacacionAnterior:
    "bg-vacacion-anterior-bg text-vacacion-anterior-text border border-vacacion-anterior-text rounded-md",
  nota: "bg-nota-bg text-nota-text border border-nota-text rounded-md",
  feriado: "bg-feriado-bg text-feriado-text border border-feriado-text rounded-md",
};

export default function Badge({ variant = "default", bold = false, children }: Props) {
  return (
    <span
      className={`inline-block text-xs px-2 py-1 ${VARIANT_CLASSES[variant]} ${
        bold ? "font-bold" : "font-medium"
      }`}
    >
      {children}
    </span>
  );
}
