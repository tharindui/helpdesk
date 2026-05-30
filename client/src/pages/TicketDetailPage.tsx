import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { TicketStatus, TicketCategory, SenderType } from "@helpdesk/core";
import { ticketsApi, type Reply } from "./ticketsApi";
import { usersApi } from "./usersApi";
import { AssigneeCombobox } from "@/components/AssigneeCombobox";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertMessage } from "@/components/AlertMessage";
import { ReplyForm } from "./ReplyForm";

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const ticketId = Number(id);

  const queryClient = useQueryClient();

  const { data: ticket, isPending, isError } = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: () => ticketsApi.get(ticketId),
    enabled: !isNaN(ticketId),
  });

  const { data: assignees } = useQuery({
    queryKey: ["users", "assignable"],
    queryFn: usersApi.listAssignable,
  });

  const { data: replies = [] } = useQuery({
    queryKey: ["replies", ticketId],
    queryFn: () => ticketsApi.listReplies(ticketId),
    enabled: !isNaN(ticketId),
  });

  const assignMutation = useMutation({
    mutationFn: (assignedToId: string | null) => ticketsApi.update(ticketId, { assignedToId }),
    onSuccess: (updated) => queryClient.setQueryData(["ticket", ticketId], updated),
  });

  const statusMutation = useMutation({
    mutationFn: (status: TicketStatus) => ticketsApi.update(ticketId, { status }),
    onSuccess: (updated) => queryClient.setQueryData(["ticket", ticketId], updated),
  });

  const categoryMutation = useMutation({
    mutationFn: (category: TicketCategory | null) => ticketsApi.update(ticketId, { category }),
    onSuccess: (updated) => queryClient.setQueryData(["ticket", ticketId], updated),
  });

  const replyMutation = useMutation({
    mutationFn: (body: string) => ticketsApi.createReply(ticketId, body),
    onSuccess: (reply) =>
      queryClient.setQueryData<Reply[]>(["replies", ticketId], (prev = []) => [...prev, reply]),
  });

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-32" />
        <div className="rounded-lg border border-border bg-background">
          <div className="border-b border-border px-6 py-4 space-y-3">
            <Skeleton className="h-7 w-2/3" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
          <div className="px-6 py-4 border-b border-border grid grid-cols-[auto_1fr] gap-x-6 gap-y-3">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="px-6 py-5 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="space-y-4">
        <Link to="/tickets" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to tickets
        </Link>
        <AlertMessage message="Ticket not found or could not be loaded." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/tickets" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to tickets
      </Link>

      <div className="rounded-lg border border-border bg-background">
        <div className="border-b border-border px-6 py-4 space-y-3">
          <h1 className="text-xl font-semibold text-foreground">{ticket.subject}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <StatusSelect
              value={ticket.status}
              onChange={(s) => statusMutation.mutate(s)}
              disabled={statusMutation.isPending}
            />
            <CategorySelect
              value={ticket.category}
              onChange={(c) => categoryMutation.mutate(c)}
              disabled={categoryMutation.isPending}
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
            assignees={assignees ?? []}
            value={ticket.assignedTo?.id ?? null}
            onChange={(id) => assignMutation.mutate(id)}
            disabled={assignMutation.isPending || !assignees}
          />
        </div>

        <div className="px-6 py-5 border-b border-border">
          <p className="text-sm text-foreground whitespace-pre-wrap">{ticket.body}</p>
        </div>

        <div className="px-6 py-5 space-y-4">
          <h2 className="text-sm font-medium text-foreground">
            {replies.length === 0 ? "No replies yet" : `Replies (${replies.length})`}
          </h2>
          {replies.map((reply) => {
            const isAgent = reply.senderType === SenderType.agent;
            return (
              <div key={reply.id} className={`flex ${isAgent ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-lg border px-4 py-3 space-y-1 ${isAgent ? "bg-primary/10 border-primary/20" : "bg-muted border-border"}`}>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {isAgent ? reply.author?.name : "Customer"}
                    </span>
                    <span>·</span>
                    <span>
                      {new Date(reply.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{reply.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ReplyForm
        onSubmit={(body) => replyMutation.mutate(body)}
        isPending={replyMutation.isPending}
        isError={replyMutation.isError}
      />
    </div>
  );
}


const STATUS_CLASSES: Record<TicketStatus, string> = {
  [TicketStatus.open]: "bg-primary/10 border-primary/20 text-primary",
  [TicketStatus.resolved]: "bg-muted border-border text-muted-foreground",
  [TicketStatus.closed]: "bg-muted border-border text-muted-foreground opacity-60",
};

function StatusSelect({ value, onChange, disabled }: {
  value: TicketStatus;
  onChange: (v: TicketStatus) => void;
  disabled?: boolean;
}) {
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

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  [TicketCategory.general_question]: "General",
  [TicketCategory.technical_question]: "Technical",
  [TicketCategory.refund_request]: "Refund",
};

function CategorySelect({ value, onChange, disabled }: {
  value: TicketCategory | null;
  onChange: (v: TicketCategory | null) => void;
  disabled?: boolean;
}) {
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
