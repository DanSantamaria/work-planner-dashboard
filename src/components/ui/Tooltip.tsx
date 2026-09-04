"use client";

import { useState, type ReactNode } from "react";

type Props = {
  contenido: ReactNode;
  children: ReactNode;
  // Positioning classes for the root. The default shrink-to-fit inline
  // wrapper is right almost everywhere, but month view's mark is itself
  // absolutely positioned, and an absolute child contributes nothing to
  // its parent's size — an inline-block root there would collapse to zero
  // and take the hover area with it. So that caller passes the absolute
  // positioning down to this root instead. Whatever is passed must
  // establish a positioning context: the bubble below anchors to it.
  claseRaiz?: string;
};

// A hover-only affordance, on purpose. On touch there is no hover, and the
// obvious fix — open it on tap — would collide with the tap that already does
// the primary thing underneath (in the calendar, opening the evento modal,
// where the same note is shown in full). So on touch devices this renders its
// children and nothing else, rather than leaving a control that can never be
// triggered.
export default function Tooltip({
  contenido,
  children,
  claseRaiz = "relative inline-block",
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className={claseRaiz}
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
