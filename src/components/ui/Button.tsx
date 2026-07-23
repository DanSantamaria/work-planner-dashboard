"use client";

import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "success";
type ButtonSize = "sm" | "md" | "lg";

type Props = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const FILLED_VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-accent hover:opacity-90 text-white",
  secondary: "bg-sidebar hover:opacity-90 text-white",
  danger: "bg-ausente-text hover:opacity-90 text-white",
  success: "bg-green-600 hover:bg-green-700 text-white",
  ghost: "bg-transparent",
};

const FILLED_SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "text-xs px-3 py-1.5",
  md: "text-sm px-4 py-2",
  lg: "text-base px-5 py-2.5",
};

const GHOST_SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...rest
}: Props) {
  const isGhost = variant === "ghost";
  const sizeClasses = isGhost ? GHOST_SIZE_CLASSES[size] : FILLED_SIZE_CLASSES[size];
  const shapeClasses = isGhost ? "" : "rounded-lg";

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-medium cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${FILLED_VARIANT_CLASSES[variant]} ${sizeClasses} ${shapeClasses} ${className ?? ""}`}
      {...rest}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}
