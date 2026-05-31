import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TicketsPage from "../TicketsPage";
import TicketDetailPage from "../TicketDetailPage";
import { ReplyForm } from "../ReplyForm";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export function renderTicketsPage() {
  const queryClient = makeQueryClient();
  const utils = render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <TicketsPage />
      </QueryClientProvider>
    </MemoryRouter>
  );
  return { ...utils, queryClient };
}

export function renderReplyForm({
  ticketId = 1,
  onSubmit = () => {},
  isPending = false,
  isError = false,
}: {
  ticketId?: number;
  onSubmit?: (body: string) => void;
  isPending?: boolean;
  isError?: boolean;
} = {}) {
  return render(
    <ReplyForm
      ticketId={ticketId}
      onSubmit={onSubmit}
      isPending={isPending}
      isError={isError}
    />
  );
}

export function renderTicketDetailPage(id = 1) {
  const queryClient = makeQueryClient();
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/tickets/${id}`]}>
        <Routes>
          <Route path="/tickets/:id" element={<TicketDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
  return { ...utils, queryClient };
}
