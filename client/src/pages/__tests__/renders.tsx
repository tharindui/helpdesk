import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import UsersPage from "../UsersPage";
import TicketsPage from "../TicketsPage";
import TicketDetailPage from "../TicketDetailPage";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export function renderUsersPage() {
  const queryClient = makeQueryClient();
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <UsersPage />
    </QueryClientProvider>
  );
  return { ...utils, queryClient };
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
