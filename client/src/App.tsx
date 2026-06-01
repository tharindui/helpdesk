import { Sentry } from "./lib/sentry";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { Role } from "@helpdesk/core";
import { authClient } from "./lib/auth-client";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import TicketsPage from "./pages/tickets/TicketsPage";
import UsersPage from "./pages/users/UsersPage";
import AppLayout from "./components/AppLayout";
import TicketDetailPage from "./pages/tickets/TicketDetailPage";

function ProtectedRoute() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return session ? <Outlet /> : <Navigate to="/login" replace />;
}

function AdminRoute() {
  const { data: session, isPending } = authClient.useSession();
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }
  return session?.user.role === Role.admin ? <Outlet /> : <Navigate to="/" replace />;
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => Sentry.captureException(error),
  }),
  mutationCache: new MutationCache({
    onError: (error) => Sentry.captureException(error),
  }),
});

export default function App() {
  return (
    <Sentry.ErrorBoundary fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Something went wrong. Please refresh the page.</p>
      </div>
    }>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/tickets" element={<TicketsPage />} />
                <Route path="/tickets/:id" element={<TicketDetailPage />} />
                <Route element={<AdminRoute />}>
                  <Route path="/users" element={<UsersPage />} />
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  );
}
