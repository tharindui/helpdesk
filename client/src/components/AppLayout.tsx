import { Outlet } from "react-router-dom";
import NavBar from "./NavBar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ background: "radial-gradient(ellipse 120% 60% at 50% -10%, oklch(0.92 0.03 184 / 0.18) 0%, transparent 70%), var(--background)" }}>
      <NavBar />
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-10">
        <Outlet />
      </main>
      <footer className="border-t border-border py-4">
        <p className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Helpdesk
        </p>
      </footer>
    </div>
  );
}
