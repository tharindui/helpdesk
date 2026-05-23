import { authClient } from "../lib/auth-client";

export default function HomePage() {
  const { data: session } = authClient.useSession();

  return (
    <>
      <h2 className="text-xl font-semibold text-foreground">
        Welcome back, {session?.user.name ?? "Agent"}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">Ticket dashboard coming soon.</p>
    </>
  );
}
