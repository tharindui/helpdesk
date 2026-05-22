import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { authClient } from "../lib/auth-client";
import { Button } from "@/components/ui/button";

export default function NavBar() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate("/login", { replace: true });
  };

  const initials = session?.user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
        <span className="text-base font-semibold tracking-tight">Helpdesk</span>

        <div className="flex items-center gap-2">
          {session && (
            <>
              <div className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium select-none">
                {initials}
              </div>
              <span className="text-sm text-muted-foreground hidden sm:block">
                {session.user.name}
              </span>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="size-4" />
            <span className="hidden sm:block">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
