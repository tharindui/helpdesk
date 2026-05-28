import { TicketStatus, TicketCategory } from "@helpdesk/core";
import { Skeleton } from "@/components/ui/skeleton";
import { type Ticket } from "./ticketsApi";

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

export function TicketTable({ tickets }: { tickets: Ticket[] }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Subject</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">From</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Received</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket, i) => (
            <tr key={ticket.id} className={i < tickets.length - 1 ? "border-b border-border" : ""}>
              <td className="px-4 py-3 font-medium text-foreground max-w-xs truncate">
                {ticket.subject}
              </td>
              <td className="px-4 py-3">
                <span className="block text-foreground">{ticket.fromName}</span>
                <span className="block text-xs text-muted-foreground">{ticket.fromEmail}</span>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={ticket.status} />
              </td>
              <td className="px-4 py-3">
                {ticket.category
                  ? <CategoryBadge category={ticket.category} />
                  : <span className="text-muted-foreground">—</span>}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(ticket.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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
