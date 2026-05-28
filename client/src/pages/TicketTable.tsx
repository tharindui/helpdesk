import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type OnChangeFn,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { TicketStatus, TicketCategory } from "@helpdesk/core";
import { Skeleton } from "@/components/ui/skeleton";
import { type Ticket } from "./ticketsApi";

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function TicketTableSkeleton() {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {["Subject", "From", "Status", "Category", "Received"].map((h) => (
              <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className={i < 4 ? "border-b border-border" : ""}>
              <td className="px-4 py-3"><Skeleton className="h-4 w-48" /></td>
              <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
              <td className="px-4 py-3"><Skeleton className="h-5 w-14 rounded-full" /></td>
              <td className="px-4 py-3"><Skeleton className="h-5 w-24 rounded-full" /></td>
              <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Column definitions (stable module-level reference)
// ---------------------------------------------------------------------------

const columnHelper = createColumnHelper<Ticket>();

const columns = [
  columnHelper.accessor("subject", {
    header: "Subject",
    enableSorting: true,
    cell: (info) => (
      <span className="font-medium text-foreground max-w-xs truncate block">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("fromName", {
    id: "fromName",
    header: "From",
    enableSorting: true,
    cell: (info) => (
      <>
        <span className="block text-foreground">{info.getValue()}</span>
        <span className="block text-xs text-muted-foreground">
          {info.row.original.fromEmail}
        </span>
      </>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    enableSorting: true,
    cell: (info) => <StatusBadge status={info.getValue()} />,
  }),
  columnHelper.accessor("category", {
    header: "Category",
    enableSorting: true,
    cell: (info) =>
      info.getValue() ? (
        <CategoryBadge category={info.getValue()!} />
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  }),
  columnHelper.accessor("createdAt", {
    header: "Received",
    enableSorting: true,
    cell: (info) =>
      new Date(info.getValue()).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
  }),
];

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

type Props = {
  tickets: Ticket[];
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
};

export function TicketTable({ tickets, sorting, onSortingChange }: Props) {
  const table = useReactTable({
    data: tickets,
    columns,
    state: { sorting },
    onSortingChange,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b border-border bg-muted/40">
              {hg.headers.map((header) => {
                const sorted = header.column.getIsSorted();
                return (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left font-medium text-muted-foreground"
                  >
                    {header.column.getCanSort() ? (
                      <button
                        onClick={header.column.getToggleSortingHandler()}
                        className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sorted === "asc" ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : sorted === "desc" ? (
                          <ArrowDown className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40" />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, i) => (
            <tr
              key={row.id}
              className={i < tickets.length - 1 ? "border-b border-border" : ""}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3 text-muted-foreground">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: TicketStatus }) {
  if (status === TicketStatus.open) {
    return (
      <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary">
        Open
      </span>
    );
  }
  if (status === TicketStatus.resolved) {
    return (
      <span className="inline-flex items-center rounded-full bg-muted border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
        Resolved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-muted border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground opacity-60">
      Closed
    </span>
  );
}

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  [TicketCategory.general_question]: "General",
  [TicketCategory.technical_question]: "Technical",
  [TicketCategory.refund_request]: "Refund",
};

function CategoryBadge({ category }: { category: TicketCategory }) {
  return (
    <span className="inline-flex items-center rounded-full bg-muted border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      {CATEGORY_LABELS[category]}
    </span>
  );
}
