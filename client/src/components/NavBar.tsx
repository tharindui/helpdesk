import { NavLink, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Role } from "@helpdesk/core";
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
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="h-0.5 bg-gradient-to-r from-primary/60 via-primary/30 to-transparent" />
      <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between border-b border-border/60">
        <div className="flex items-center gap-7">
          <NavLink to="/" className="font-serif text-lg font-semibold tracking-tight text-foreground hover:text-primary transition-colors">
            Helpdesk
          </NavLink>
          <nav className="flex items-center gap-1">
            <NavLink
              to="/tickets"
              className={({ isActive }) =>
                `text-sm px-3 py-1.5 rounded-md transition-colors ${isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`
              }
            >
              Tickets
            </NavLink>
            {session?.user.role === Role.admin && (
              <NavLink
                to="/users"
                className={({ isActive }) =>
                  `text-sm px-3 py-1.5 rounded-md transition-colors ${isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`
                }
              >
                Users
              </NavLink>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {session && (
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold select-none ring-2 ring-primary/20">
                {initials}
              </div>
              <span className="text-sm font-medium text-foreground hidden sm:block">
                {session.user.name}
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="size-4" />
            <span className="hidden sm:block">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
