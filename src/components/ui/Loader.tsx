// The app logo, simplified to four rounded squares (same colours as the
// logo: white squares with a dark outline, one orange). The orange travels
// clockwise from square to square, which tells the user "something is
// happening" and keeps the brand on screen while the page loads.
//
// The animation itself lives in globals.css (.loader-cell). Each square only
// says which turn it takes through the `--i` variable: 0, 1, 2, 3.

// Clockwise from the top-left: TL → TR → BR → BL. Coordinates are in a
// 100x100 drawing that the browser scales to whatever size we ask for.
const CELDAS = [
  { x: 6, y: 6 },
  { x: 56, y: 6 },
  { x: 56, y: 56 },
  { x: 6, y: 56 },
];

export function Loader({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={`h-14 w-14 ${className ?? ""}`}
    >
      {CELDAS.map((celda, i) => (
        <rect
          key={i}
          x={celda.x}
          y={celda.y}
          width={38}
          height={38}
          rx={8}
          strokeWidth={5}
          className={`loader-cell ${i === 1 ? "loader-cell-logo" : ""}`}
          style={{ "--i": i } as React.CSSProperties}
        />
      ))}
    </svg>
  );
}

// What each page's loading.tsx renders: the real title (it never changes, so
// it shows instantly) and the loader centred in the space below it.
// role="status" + the hidden text lets screen readers announce "Cargando...".
export function PageLoader({ title }: { title: string }) {
  return (
    <div role="status" aria-busy="true">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{title}</h1>
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader />
      </div>
      <span className="sr-only">Cargando...</span>
    </div>
  );
}
