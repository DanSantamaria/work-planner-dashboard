"use client";

import type { InputHTMLAttributes } from "react";

type Props = {
  label?: string;
  error?: string;
  wrapperClassName?: string;
  compact?: boolean;
} & InputHTMLAttributes<HTMLInputElement>;

export default function Input({
  label,
  error,
  wrapperClassName,
  compact = false,
  className,
  ...rest
}: Props) {
  const sizeClasses = compact
    ? "rounded px-2 py-1"
    : "rounded-lg px-3 py-2";

  return (
    <div className={wrapperClassName}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        className={`w-full border border-gray-300 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sidebar ${sizeClasses} ${className ?? ""}`}
        {...rest}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
