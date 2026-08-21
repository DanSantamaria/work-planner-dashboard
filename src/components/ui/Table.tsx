import type {
  ReactNode,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";

type TableProps = {
  children: ReactNode;
  className?: string;
};

// No overflow here on purpose — see the note in GridTable: an overflow of any
// kind would become the scroll container and kill the header's sticking.
export function Table({ children, className }: TableProps) {
  return (
    <div className={`border border-gray-200 rounded-lg ${className ?? ""}`}>
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

// `[&>th]:` applies the sticking to every header cell of this row rather than
// to the row itself: Safari doesn't support position:sticky on a <tr>.
// sticky={false} is for tables living inside a clipped or animated box (see
// BalanceTable, wrapped in the collapsible panel's overflow-hidden), where
// there is no scrolling ancestor to stick to and a pinned header only gets in
// the way.
export function TableHead({
  children,
  sticky = true,
}: {
  children: ReactNode;
  sticky?: boolean;
}) {
  // Negative top, not top-0: border-collapse draws a cell's outer border
  // centered on the grid line, so half of it lives outside the cell box and
  // peeks out as a sliver between the app bar and the pinned header. 2px of
  // overlap swallows it — including the 4px "today" bar in the calendar
  // grids, whose outer half is the widest offender. Don't push this past 2px:
  // at 4px the today bar itself would disappear once the header pins.
  const stickyClase = sticky ? "[&>th]:sticky [&>th]:-top-0.5 [&>th]:z-20" : "";

  return (
    <thead>
      <tr className={`bg-sidebar text-white ${stickyClase}`}>{children}</tr>
    </thead>
  );
}

export function TableHeaderCell({
  children,
  className,
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      // bg-sidebar repeats the color TableHead paints on the <tr>: a sticky
      // cell keeps its own background while the row's stays behind, so
      // without it the header would go see-through over the scrolling rows.
      className={`border border-white/10 bg-sidebar px-4 py-3 text-left ${className ?? ""}`}
      {...rest}
    >
      {children}
    </th>
  );
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

type TableRowProps = {
  index?: number;
  className?: string;
  children: ReactNode;
};

// Only data rows (the ones passing an index) get the zebra stripe and the
// hover highlight — group-header rows render their own <tr> with their own
// background and must not light up under the cursor.
export function TableRow({ index, className, children }: TableRowProps) {
  const esFilaDeDatos = index !== undefined;
  const stripeClass = !esFilaDeDatos
    ? ""
    : index % 2 === 0
      ? "bg-white"
      : "bg-gray-50";
  const hoverClass = esFilaDeDatos ? "hover:bg-row-hover" : "";

  return (
    <tr className={`${stripeClass} ${hoverClass} ${className ?? ""}`}>
      {children}
    </tr>
  );
}

export function TableCell({
  children,
  className,
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={`border border-gray-200 px-4 py-2 ${className ?? ""}`}
      {...rest}
    >
      {children}
    </td>
  );
}
