import { TicketCategory } from "@helpdesk/core";

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  [TicketCategory.general_question]:  "General",
  [TicketCategory.technical_question]: "Technical",
  [TicketCategory.refund_request]:    "Refund",
};

type Props = {
  value: TicketCategory | null;
  onChange: (v: TicketCategory | null) => void;
  disabled?: boolean;
};

export function CategorySelect({ value, onChange, disabled }: Props) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange((e.target.value as TicketCategory) || null)}
      disabled={disabled}
      className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
    >
      <option value="">No category</option>
      {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
        <option key={val} value={val}>{label}</option>
      ))}
    </select>
  );
}
