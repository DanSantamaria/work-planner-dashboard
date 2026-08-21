"use client";

import { useSyncExternalStore } from "react";

const CONSULTA = "(max-width: 767px)"; // below Tailwind's md

function suscribir(alCambiar: () => void) {
  const mq = window.matchMedia(CONSULTA);
  mq.addEventListener("change", alCambiar);
  return () => mq.removeEventListener("change", alCambiar);
}

/**
 * Whether the viewport is phone-sized, for the rare decision CSS can't make —
 * one that changes *what React renders*, not just how it looks.
 *
 * useSyncExternalStore rather than state + an effect: it has a slot for the
 * value the server should assume (false — the server can't know the width),
 * so hydration stays consistent, and it re-renders on rotation for free.
 * Anything that only changes appearance belongs in a `md:` class instead.
 */
export function useEsMovil(): boolean {
  return useSyncExternalStore(
    suscribir,
    () => window.matchMedia(CONSULTA).matches,
    () => false
  );
}
