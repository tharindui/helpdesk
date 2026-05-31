import DOMPurify from "dompurify";
import { type TicketStatus, type TicketCategory } from "@helpdesk/core";
import { type TicketDetail, type Reply } from "./ticketsApi";
import { type Assignee } from "../users/usersApi";
import { AssigneeCombobox } from "@/components/AssigneeCombobox";
import { StatusSelect } from "./StatusSelect";
import { CategorySelect } from "./CategorySelect";
import { ReplyThread } from "./ReplyThread";
import { TicketSummary } from "./TicketSummary";

type Props = {
  ticket: TicketDetail;
  assignees: Assignee[];
  assigneesLoading: boolean;
  replies: Reply[];
  onStatusChange: (s: TicketStatus) => void;
  onCategoryChange: (c: TicketCategory | null) => void;
  onAssigneeChange: (id: string | null) => void;
  statusPending: boolean;
  categoryPending: boolean;
  assigneePending: boolean;
};

export function TicketCard({
  ticket,
  assignees,
  assigneesLoading,
  replies,
  onStatusChange,
  onCategoryChange,
  onAssigneeChange,
  statusPending,
  categoryPending,
  assigneePending,
}: Props) {
  return (
    <div className="rounded-lg border border-border bg-background">
      <div className="border-b border-border px-6 py-4 space-y-3">
        <h1 className="text-xl font-semibold text-foreground">{ticket.subject}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <StatusSelect
            value={ticket.status}
            onChange={onStatusChange}
            disabled={statusPending}
          />
          <CategorySelect
            value={ticket.category}
            onChange={onCategoryChange}
            disabled={categoryPending}
          />
        </div>
      </div>

      <div className="px-6 py-4 border-b border-border grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        <span className="text-muted-foreground">From</span>
        <span className="text-foreground">
          {ticket.fromName}{" "}
          <span className="text-muted-foreground">&lt;{ticket.fromEmail}&gt;</span>
        </span>
        <span className="text-muted-foreground">Received</span>
        <span className="text-foreground">
          {new Date(ticket.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <span className="text-muted-foreground self-center">Assigned to</span>
        <AssigneeCombobox
          assignees={assignees}
          value={ticket.assignedTo?.id ?? null}
          onChange={onAssigneeChange}
          disabled={assigneePending || assigneesLoading}
        />
      </div>

      <div className="px-6 py-5 border-b border-border">
        {ticket.bodyHTML ? (
          <div
            className="text-sm text-foreground"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(ticket.bodyHTML) }}
          />
        ) : (
          <p className="text-sm text-foreground whitespace-pre-wrap">{ticket.body}</p>
        )}
      </div>

      <ReplyThread replies={replies} />
      <TicketSummary ticketId={ticket.id} />
    </div>
  );
}
