"use client";

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
        <button
          onClick={onGuardar}
          disabled={saving}
          className="bg-[#211E2F] hover:opacity-90 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer"
        >
          {saving ? "Guardando..." : "Guardar Borrador"}
        </button>
      )}

      {!publicada && (
        <button
          onClick={onPublicar}
          disabled={saving}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer"
        >
          Publicar
        </button>
      )}

      {publicada && (
        <button
          onClick={onGuardar}
          disabled={saving}
          className="bg-[#211E2F] hover:opacity-90 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      )}

      {publicada && (
        <button
          onClick={onDespublicar}
          disabled={saving}
          className="bg-[#E9865C] hover:opacity-90 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer"
        >
          Despublicar
        </button>
      )}

      {isAdmin && (
        <button
          onClick={onEliminar}
          disabled={saving}
          className="bg-[#E81414] hover:opacity-90 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg cursor-pointer"
        >
          Eliminar Semana
        </button>
      )}
    </div>
  );
}
