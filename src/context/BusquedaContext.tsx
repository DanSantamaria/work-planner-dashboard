"use client";

import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type BusquedaContextValue = {
  busqueda: string;
  setBusqueda: (valor: string) => void;
};

const BusquedaContext = createContext<BusquedaContextValue | undefined>(
  undefined
);

export function BusquedaProvider({ children }: { children: ReactNode }) {
  const [busqueda, setBusqueda] = useState("");

  return (
    <BusquedaContext.Provider value={{ busqueda, setBusqueda }}>
      {children}
    </BusquedaContext.Provider>
  );
}

export function useBusqueda() {
  const context = useContext(BusquedaContext);
  if (!context) {
    throw new Error("useBusqueda debe usarse dentro de un BusquedaProvider");
  }
  return context;
}
