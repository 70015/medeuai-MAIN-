import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { PageTransition } from "@/components/page-transition";
import {
  Brain,
  FileText,
  Home,
  Info,
  LineChart,
  LogOut,
  MoreVertical,
  Settings,
  Shield,
  Layers,
  User as UserIcon,
} from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BrandMark } from "@/components/brand-logo";
import { useAvatarUrl } from "@/lib/avatar";
import { isAdminHost } from "@/lib/host";
import { ThemeToggle } from "./theme-toggle";

export function useProfile() {
  return useQuery({
    queryKey: ["profile", "me"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** Desktop sidebar navigation — routes unchanged. */
const sidebarNav = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/ai-teacher", label: "AI Teacher", icon: Brain },
  { to: "/tests", label: "Practice", icon: FileText },
  { to: "/tests", label: "Previous Papers", icon: Layers, search: { exam: "all" } as const },
  { to: "/progress", label: "Progress", icon: LineChart },
  { to: "/profile", label: "Profile", icon: UserIcon },
  { to: "/billing", label: "Settings", icon: Settings },
] as const;

/** Mobile bottom navigation — AI Teacher is the centred, prominent item. */
const mobileNav = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/tests", label: "Practice", icon: FileText },
  { to: "/ai-teacher", label: "AI Teacher", icon: Brain, primary: true },
  { to: "/progress", label: "Progress", icon: LineChart },
  { to: "/profile", label: "Profile", icon: UserIcon },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const avatarSrc = useAvatarUrl(profile?.avatar_url);
  const [email, setEmail] = useState<string | null>(null);

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: u.user.id,
        _role: "admin",
      });
      if (error) return false;
      return !!data;
    },
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", search: { mode: "signin" }, replace: true });
  }

  const initials = (profile?.full_name || email || "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const adminMode = isAdminHost();

  const brand = (
    <Link
      to={adminMode ? "/admin" : "/dashboard"}
      className="flex items-center gap-2 font-bold tracking-tight"
    >
      {adminMode ? (
        <span className="grid h-9 w-9 place-items-center rounded-md bg-destructive text-destructive-foreground">
          <Shield className="h-4 w-4" />
        </span>
      ) : (
        <BrandMark className="h-9 w-9" />
      )}
      <span className="text-base">
        MedEu<span className={adminMode ? "text-destructive" : "text-primary"}>.Ai</span>
        {adminMode && (
          <span className="ml-1.5 text-xs font-medium text-muted-foreground">Admin</span>
        )}
      </span>
    </Link>
  );

  const isActive = (to: string) =>
    to === "/dashboard" ? pathname === to : pathname.startsWith(to);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      {!adminMode && (
        <aside
          className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-background lg:flex"
          aria-label="Main navigation"
        >
          <div className="flex h-16 items-center px-5">{brand}</div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {sidebarNav.map((n) => {
              const active = n.label === "Previous Papers" ? false : isActive(n.to);
              return (
                <Link
                  key={n.label}
                  to={n.to}
                  {...("search" in n ? { search: n.search } : {})}
                  aria-current={active ? "page" : undefined}
                  className={
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors " +
                    (active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground")
                  }
                >
                  <n.icon className="h-4 w-4 shrink-0" />
                  {n.label}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                to="/admin"
                className={
                  "mt-2 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors " +
                  (pathname.startsWith("/admin")
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground")
                }
              >
                <Shield className="h-4 w-4 shrink-0" />
                Admin Panel
              </Link>
            )}
          </nav>
          <div className="border-t border-border p-3">
            <div className="flex items-center gap-3 px-2 py-1.5">
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarSrc} alt={profile?.full_name ?? "Your profile photo"} />
                <AvatarFallback className="bg-secondary text-xs font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">
                  {profile?.full_name ?? "Student"}
                </div>
                <div className="truncate text-xs text-muted-foreground">{email}</div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Sign out"
                onClick={signOut}
                className="text-muted-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </aside>
      )}

      <div className={adminMode ? "" : "lg:pl-64"}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-border bg-background">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
            <div className="lg:hidden">{brand}</div>
            <div className="hidden lg:block" />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {/* No profile avatar here — Profile lives only in the primary navigation. */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="More options">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    Menu
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/about" className="cursor-pointer">
                      <Info className="mr-2 h-4 w-4" /> About us
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/billing" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" /> Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 pb-28 pt-6 sm:pt-8 lg:pb-12">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      {!adminMode && (
        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] lg:hidden"
          aria-label="Primary"
        >
          <ul className="mx-auto grid max-w-md grid-cols-5 items-end">
            {mobileNav.map((n) => {
              const active = isActive(n.to);
              if ("primary" in n && n.primary) {
                return (
                  <li key={n.label} className="flex justify-center">
                    <Link
                      to={n.to}
                      aria-current={active ? "page" : undefined}
                      className="-mt-5 flex flex-col items-center gap-1 pb-2"
                    >
                      <span
                        className={
                          "grid place-items-center rounded-full border-4 border-background " +
                          (active
                            ? "bg-ink text-ink-foreground"
                            : "bg-primary text-primary-foreground")
                        }
                        style={{ height: "3.25rem", width: "3.25rem" }}
                      >
                        <n.icon className="h-6 w-6" />
                      </span>
                      <span className="text-[11px] font-semibold text-foreground">{n.label}</span>
                    </Link>
                  </li>
                );
              }
              return (
                <li key={n.label}>
                  <Link
                    to={n.to}
                    aria-current={active ? "page" : undefined}
                    className={
                      "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors " +
                      (active ? "text-primary" : "text-muted-foreground hover:text-foreground")
                    }
                  >
                    <n.icon className="h-5 w-5" />
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}
