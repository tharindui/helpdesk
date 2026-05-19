import { useNavigate } from "react-router-dom";
import { authClient } from "../lib/auth-client";

export default function NavBar() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
        <span className="text-base font-bold text-gray-900">Helpdesk</span>
        <div className="flex items-center gap-4">
          {session && (
            <span className="text-sm text-gray-600">{session.user.name}</span>
          )}
          <button
            onClick={handleSignOut}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors duration-150"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}
