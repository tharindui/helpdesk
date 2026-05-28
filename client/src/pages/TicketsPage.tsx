import { useTickets } from "./useTickets";
import { TicketTable, TicketTableSkeleton } from "./TicketTable";

export default function TicketsPage() {
  const { data: tickets = [], isPending, isError } = useTickets();

  if (isPending) {
    return (
      <div className="py-8">
        <div className="mb-6 space-y-2">
          <div className="h-8 w-24 rounded bg-muted animate-pulse" />
          <div className="h-4 w-16 rounded bg-muted animate-pulse" />
        </div>
        <TicketTableSkeleton />
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Tickets</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}
        </p>
      </div>

      {isError && (
        <div className="mb-6 rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
          Something went wrong. Please try again.
        </div>
      )}

      {!isError && tickets.length === 0 ? (
        <div className="rounded-lg border border-border bg-background py-12 text-center">
          <p className="text-sm text-muted-foreground">No tickets yet.</p>
        </div>
      ) : (
        <TicketTable tickets={tickets} />
      )}
    </div>
  );
}
