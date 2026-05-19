import { authClient } from "../lib/auth-client";
import NavBar from "../components/NavBar";

export default function HomePage() {
  const { data: session } = authClient.useSession();

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h2 className="text-xl font-semibold text-gray-800">
          Welcome back, {session?.user.name ?? "Agent"}
        </h2>
        <p className="mt-2 text-sm text-gray-500">Ticket dashboard coming soon.</p>
      </main>
    </div>
  );
}
