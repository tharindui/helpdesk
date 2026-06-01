import { TicketStatus } from "@helpdesk/core";

const STATUS_CLASSES: Record<TicketStatus, string> = {
  [TicketStatus.new]:        "bg-muted border-border text-muted-foreground",
  [TicketStatus.processing]: "bg-amber-50 border-amber-200 text-amber-700",
  [TicketStatus.open]:       "bg-primary/10 border-primary/20 text-primary",
  [TicketStatus.resolved]:   "bg-muted border-border text-muted-foreground",
  [TicketStatus.closed]:     "bg-muted border-border text-muted-foreground opacity-60",
};

type Props = {
  value: TicketStatus;
  onChange: (v: TicketStatus) => void;
  disabled?: boolean;
};

export function StatusSelect({ value, onChange, disabled }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as TicketStatus)}
      disabled={disabled}
      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${STATUS_CLASSES[value]}`}
    >
      <option value={TicketStatus.open}>Open</option>
      <option value={TicketStatus.resolved}>Resolved</option>
      <option value={TicketStatus.closed}>Closed</option>
    </select>
  );
}
