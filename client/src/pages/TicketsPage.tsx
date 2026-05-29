import { useState, useEffect } from "react";
import { type SortingState } from "@tanstack/react-table";
import { TicketStatus, TicketCategory } from "@helpdesk/core";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTickets } from "./useTickets";
import { TicketTable, TicketTableSkeleton } from "./TicketTable";

export default function TicketsPage() {
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: tickets = [], isPending, isError } = useTickets(sorting, {
    status: statusFilter,
    category: categoryFilter,
    search,
  });

  const hasFilters = statusFilter !== null || categoryFilter !== null || search !== "";

  return (
    <div className="py-8">
      <div className="mb-6">
        {isPending ? (
          <div className="space-y-2">
            <div className="h-8 w-24 rounded bg-muted animate-pulse" />
            <div className="h-4 w-16 rounded bg-muted animate-pulse" />
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-foreground">Tickets</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}
            </p>
          </>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by subject, name, or email…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={statusFilter ?? "all"}
          onValueChange={(v) => setStatusFilter(v === "all" ? null : (v as TicketStatus))}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value={TicketStatus.open}>Open</SelectItem>
            <SelectItem value={TicketStatus.resolved}>Resolved</SelectItem>
            <SelectItem value={TicketStatus.closed}>Closed</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={categoryFilter ?? "all"}
          onValueChange={(v) => setCategoryFilter(v === "all" ? null : (v as TicketCategory))}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value={TicketCategory.general_question}>General</SelectItem>
            <SelectItem value={TicketCategory.technical_question}>Technical</SelectItem>
            <SelectItem value={TicketCategory.refund_request}>Refund</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isError && (
        <div className="mb-6 rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
          Something went wrong. Please try again.
        </div>
      )}

      {isPending ? (
        <TicketTableSkeleton />
      ) : !isError && tickets.length === 0 ? (
        <div className="rounded-lg border border-border bg-background py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {hasFilters ? "No tickets match your filters." : "No tickets yet."}
          </p>
        </div>
      ) : (
        <TicketTable tickets={tickets} sorting={sorting} onSortingChange={setSorting} />
      )}
    </div>
  );
}
