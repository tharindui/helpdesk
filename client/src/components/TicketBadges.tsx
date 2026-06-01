import { TicketStatus, TicketCategory } from "@helpdesk/core";

const STATUS_VARIANTS: Record<TicketStatus, { label: string; className: string }> = {
  [TicketStatus.new]: {
    label: "New",
    className: "bg-muted border-border text-muted-foreground",
  },
  [TicketStatus.processing]: {
    label: "Processing",
    className: "bg-amber-50 border-amber-200 text-amber-700",
  },
  [TicketStatus.open]: {
    label: "Open",
    className: "bg-primary/10 border-primary/20 text-primary",
  },
  [TicketStatus.resolved]: {
    label: "Resolved",
    className: "bg-muted border-border text-muted-foreground",
  },
  [TicketStatus.closed]: {
    label: "Closed",
    className: "bg-muted border-border text-muted-foreground opacity-60",
  },
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  const { label, className } = STATUS_VARIANTS[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  [TicketCategory.general_question]: "General",
  [TicketCategory.technical_question]: "Technical",
  [TicketCategory.refund_request]: "Refund",
};

export function CategoryBadge({ category }: { category: TicketCategory }) {
  return (
    <span className="inline-flex items-center rounded-full bg-muted border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      {CATEGORY_LABELS[category]}
    </span>
  );
}
