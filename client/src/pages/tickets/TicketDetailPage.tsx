import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { ticketsApi, type Reply } from "./ticketsApi";
import { usersApi } from "../users/usersApi";
import { AlertMessage } from "@/components/AlertMessage";
import { TicketDetailSkeleton } from "./TicketDetailSkeleton";
import { TicketCard } from "./TicketCard";
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
    mutationFn: (status: Parameters<typeof ticketsApi.update>[1]["status"]) =>
      ticketsApi.update(ticketId, { status }),
    onSuccess: (updated) => queryClient.setQueryData(["ticket", ticketId], updated),
  });

  const categoryMutation = useMutation({
    mutationFn: (category: Parameters<typeof ticketsApi.update>[1]["category"]) =>
      ticketsApi.update(ticketId, { category }),
    onSuccess: (updated) => queryClient.setQueryData(["ticket", ticketId], updated),
  });

  const replyMutation = useMutation({
    mutationFn: (body: string) => ticketsApi.createReply(ticketId, body),
    onSuccess: (reply) =>
      queryClient.setQueryData<Reply[]>(["replies", ticketId], (prev = []) => [...prev, reply]),
  });

  if (isPending) return <TicketDetailSkeleton />;

  return (
    <div className="space-y-6">
      <Link
        to="/tickets"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to tickets
      </Link>

      {isError || !ticket ? (
        <AlertMessage message="Ticket not found or could not be loaded." />
      ) : (
        <>
          <TicketCard
            ticket={ticket}
            assignees={assignees ?? []}
            assigneesLoading={!assignees}
            replies={replies}
            onStatusChange={(s) => statusMutation.mutate(s)}
            onCategoryChange={(c) => categoryMutation.mutate(c)}
            onAssigneeChange={(id) => assignMutation.mutate(id)}
            statusPending={statusMutation.isPending}
            categoryPending={categoryMutation.isPending}
            assigneePending={assignMutation.isPending}
          />
          <ReplyForm
            ticketId={ticketId}
            onSubmit={(body) => replyMutation.mutate(body)}
            isPending={replyMutation.isPending}
            isError={replyMutation.isError}
          />
        </>
      )}
    </div>
  );
}
