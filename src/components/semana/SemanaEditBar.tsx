"use client";

import Button from "@/components/ui/Button";

type Props = {
  publicada: boolean;
  isAdmin: boolean;
  saving: boolean;
  onGuardar: () => void;
  onPublicar: () => void;
  onDespublicar: () => void;
  onEliminar: () => void;
};

export default function SemanaEditBar({
  publicada,
  isAdmin,
  saving,
  onGuardar,
  onPublicar,
  onDespublicar,
  onEliminar,
}: Props) {
  return (
    <div className="sticky bottom-0 mt-4 flex items-center justify-end gap-3 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.05)]">
      {!publicada && (
        <Button variant="secondary" onClick={onGuardar} loading={saving}>
          {saving ? "Guardando..." : "Guardar Borrador"}
        </Button>
      )}

      {!publicada && (
        <Button variant="success" onClick={onPublicar} disabled={saving}>
          Publicar
        </Button>
      )}

      {publicada && (
        <Button variant="secondary" onClick={onGuardar} loading={saving}>
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      )}

      {publicada && (
        <Button variant="primary" onClick={onDespublicar} disabled={saving}>
          Despublicar
        </Button>
      )}

      {isAdmin && (
        <Button variant="danger" onClick={onEliminar} disabled={saving}>
          Eliminar Semana
        </Button>
      )}
    </div>
  );
}
