"use client";

import { useState, type ReactNode } from "react";

type Props = {
  contenido: ReactNode;
  children: ReactNode;
};

export default function Tooltip({ contenido, children }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="absolute z-40 top-full left-1/2 -translate-x-1/2 mt-1 w-max max-w-56 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 shadow-lg">
          {contenido}
        </div>
      )}
    </span>
  );
}
