import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";

// A grey block that pulses. Think of the "ghost" outline a shop paints on the
// wall before the real sign is installed: it shows where something will go,
// so the page doesn't look empty or frozen while the data is on its way.
// `aria-hidden` hides these decorative blocks from screen readers; the
// loading.tsx files add one hidden "Cargando..." text instead.
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-gray-200 ${className ?? ""}`}
    />
  );
}

// The real <Table> parts, filled with grey blocks instead of data, so the
// skeleton has exactly the same borders, padding and header colour as the
// table that replaces it (no visual "jump" when the data arrives).
export function TableSkeleton({
  columns,
  rows = 8,
}: {
  columns: number;
  rows?: number;
}) {
  return (
    <Table>
      <TableHead>
        {Array.from({ length: columns }, (_, c) => (
          <TableHeaderCell key={c}>
            <div
              aria-hidden="true"
              className="h-4 w-16 animate-pulse rounded bg-white/20"
            />
          </TableHeaderCell>
        ))}
      </TableHead>
      <TableBody>
        {Array.from({ length: rows }, (_, r) => (
          <TableRow key={r} index={r}>
            {Array.from({ length: columns }, (_, c) => (
              <TableCell key={c}>
                <Skeleton className="h-4 w-full max-w-40" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
