"use client";

import { useEffect } from "react";
import type { RefObject } from "react";

/**
 * Calls `onOutsideClick` when a mousedown lands outside `ref`.
 *
 * `refAdicional` covers the case where part of the widget is rendered
 * somewhere else in the DOM — a panel portalled into <body>, say — which
 * `ref.contains()` would otherwise report as "outside" and close on its own
 * clicks. Callers with a single, self-contained element can ignore it.
 */
export function useClickOutside<T extends HTMLElement, U extends HTMLElement = T>(
  ref: RefObject<T | null>,
  onOutsideClick: () => void,
  refAdicional?: RefObject<U | null>
) {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const objetivo = e.target as Node;
      const dentro =
        ref.current?.contains(objetivo) ||
        refAdicional?.current?.contains(objetivo);

      if (ref.current && !dentro) {
        onOutsideClick();
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [ref, refAdicional, onOutsideClick]);
}
