import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { ticketsApi } from "./ticketsApi";
import { usersApi } from "./usersApi";
import { StatusBadge, CategoryBadge } from "@/components/TicketBadges";
import { AssigneeCombobox } from "@/components/AssigneeCombobox";
import { Skeleton } from "@/components/ui/skeleton";

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

  const assignMutation = useMutation({
    mutationFn: (assignedToId: string | null) => ticketsApi.assign(ticketId, assignedToId),
    onSuccess: (updated) => queryClient.setQueryData(["ticket", ticketId], updated),
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
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Ticket not found or could not be loaded.
        </div>
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
            <StatusBadge status={ticket.status} />
            {ticket.category && <CategoryBadge category={ticket.category} />}
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

        <div className="px-6 py-5">
          <p className="text-sm text-foreground whitespace-pre-wrap">{ticket.body}</p>
        </div>
      </div>
    </div>
  );
}

