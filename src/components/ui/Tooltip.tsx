"use client";

import { useState, type ReactNode } from "react";

type Props = {
  contenido: ReactNode;
  children: ReactNode;
};

// A hover-only affordance, on purpose. On touch there is no hover, and the
// obvious fix — open it on tap — would collide with the tap that already does
// the primary thing underneath (in the calendar, opening the evento modal,
// where the same note is shown in full). So on touch devices this renders its
// children and nothing else, rather than leaving a control that can never be
// triggered.
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
        <div className="absolute z-40 top-full left-1/2 -translate-x-1/2 mt-1 hidden w-max max-w-56 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 shadow-lg [@media(hover:hover)]:block">
          {contenido}
        </div>
      )}
    </span>
  );
}
