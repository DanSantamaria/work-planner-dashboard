import type { ReactNode } from "react";

type BadgeVariant =
  | "default"
  | "oficina"
  | "ausente"
  | "success"
  | "warning"
  | "tarea";

type Props = {
  variant?: BadgeVariant;
  bold?: boolean;
  children: ReactNode;
};

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: "bg-gray-200 text-gray-500 rounded-full",
  oficina: "bg-oficina-bg text-oficina-text border border-oficina-text rounded-md",
  ausente: "bg-ausente-bg text-ausente-text border border-ausente-text rounded-md",
  success: "bg-green-100 text-green-700 rounded-full",
  warning: "bg-amber-100 text-amber-700 rounded-full",
  tarea: "bg-gray-50 border text-gray-700 rounded-xl my-0.4",
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
