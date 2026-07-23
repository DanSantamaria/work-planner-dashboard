import type {
  ReactNode,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";

type TableProps = {
  children: ReactNode;
  className?: string;
};

export function Table({ children, className }: TableProps) {
  return (
    <div
      className={`overflow-x-auto border border-gray-200 rounded-lg ${className ?? ""}`}
    >
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="bg-sidebar text-white">{children}</tr>
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
      className={`border border-white/10 px-4 py-3 text-left ${className ?? ""}`}
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

export function TableRow({ index, className, children }: TableRowProps) {
  const stripeClass =
    index === undefined ? "" : index % 2 === 0 ? "bg-white" : "bg-gray-50";

  return <tr className={`${stripeClass} ${className ?? ""}`}>{children}</tr>;
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
