import { NavLink, Outlet } from "react-router";
import { IconInbox, IconLogout, IconSettings } from "@tabler/icons-react";
import ChakraMark from "@/assets/chakra-mark.png";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/format";

const NAV = [
  { to: "/", label: "Enquiries", icon: IconInbox, end: true },
  { to: "/settings", label: "Settings", icon: IconSettings },
];

export default function Layout() {
  const { admin, signOut } = useAuth();
  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-night-950/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 md:px-6">
          <NavLink to="/" className="flex min-w-0 items-center gap-2.5">
            <img src={ChakraMark} alt="" className="h-9 w-auto" />
            <span className="hidden min-w-0 flex-col leading-tight sm:flex">
              <span className="truncate font-display text-lg font-semibold">Ananth Laxmi</span>
              <span className="text-[0.65rem] font-semibold tracking-[0.2em] text-gold-400 uppercase">Admin</span>
            </span>
          </NavLink>

          <nav aria-label="Main" className="ml-2 flex items-center gap-1 sm:ml-6">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm font-semibold transition-colors",
                    isActive ? "bg-gold-400/12 text-gold-200 ring-1 ring-gold-400/25" : "text-ivory/70 hover:text-ivory"
                  )
                }
              >
                <Icon className="size-[18px]" aria-hidden />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {admin && (
              <span className="hidden text-sm text-ivory-muted md:inline">
                Namaste, <span className="font-semibold text-ivory">{admin.displayName}</span>
              </span>
            )}
            <button type="button" onClick={() => signOut()} className="btn-ghost h-9 px-3" aria-label="Sign out">
              <IconLogout className="size-[18px]" aria-hidden />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-6 pb-16 md:px-6 md:pt-10">
        <Outlet />
      </main>
    </div>
  );
}
