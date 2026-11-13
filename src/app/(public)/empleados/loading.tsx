import { Skeleton, TableSkeleton } from "@/components/ui/Skeleton";

// Next.js shows this file automatically while page.tsx is waiting for its
// database queries. The title is real text (it never changes), so it appears
// instantly; only the parts that depend on data are grey blocks.
export default function Loading() {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Cargando...</span>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Empleados</h1>
      <Skeleton className="mb-4 h-10 w-36" />
      <TableSkeleton columns={6} rows={10} />
    </div>
  );
}
