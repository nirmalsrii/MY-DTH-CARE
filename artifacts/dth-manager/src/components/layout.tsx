import { Link, useLocation } from "wouter";
import { useAdminLogout, useGetAuthMe, getGetAuthMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Users,
  Bell,
  Settings,
  LogOut,
  Satellite,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/alerts", label: "Due Alerts", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const logout = useAdminLogout();
  const { data: auth } = useGetAuthMe({ query: { queryKey: getGetAuthMeQueryKey() } });

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        window.location.href = "/login";
      },
      onError: () => {
        toast({ title: "Logout failed", variant: "destructive" });
      },
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className="w-64 flex-shrink-0 flex flex-col shadow-2xl"
        style={{
          background: "linear-gradient(180deg, hsl(0,0%,9%) 0%, hsl(0,0%,7%) 100%)",
          borderRight: "1px solid hsl(0,0%,14%)",
        }}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-5" style={{ borderBottom: "1px solid hsl(0,0%,15%)" }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
              style={{ background: "linear-gradient(135deg, hsl(0,85%,55%) 0%, hsl(0,78%,42%) 100%)" }}
            >
              <Satellite className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-white leading-tight tracking-wide">ASIAN DTH</p>
              <p className="text-xs font-medium" style={{ color: "hsl(0,85%,65%)" }}>Sri Lanka Operations</p>
            </div>
          </div>
        </div>

        {/* Nav section label */}
        <div className="px-5 pt-5 pb-1">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "hsl(0,0%,38%)" }}>
            Main Menu
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/" ? location === "/" : location.startsWith(href);
            return (
              <Link key={href} href={href}>
                <a
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                    isActive
                      ? "text-white shadow-md"
                      : "hover:bg-white/5"
                  )}
                  style={isActive ? {
                    background: "linear-gradient(90deg, hsl(0,80%,48%) 0%, hsl(0,75%,42%) 100%)",
                    boxShadow: "0 2px 12px rgba(220,38,38,0.35)",
                  } : { color: "hsl(0,0%,65%)" }}
                  data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{label}</span>
                  {label === "Due Alerts" && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  )}
                </a>
              </Link>
            );
          })}
        </nav>

        {/* Stats strip */}
        <div className="mx-3 mb-3 rounded-xl p-3" style={{ background: "hsl(0,0%,13%)", border: "1px solid hsl(0,0%,18%)" }}>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3.5 h-3.5" style={{ color: "hsl(0,85%,58%)" }} />
            <p className="text-xs font-semibold" style={{ color: "hsl(0,0%,60%)" }}>ASIAN DTH</p>
          </div>
          <p className="text-xs" style={{ color: "hsl(0,0%,40%)" }}>DTH Subscription Manager</p>
        </div>

        {/* Footer */}
        <div className="px-3 pb-4" style={{ borderTop: "1px solid hsl(0,0%,14%)", paddingTop: "12px" }}>
          <div className="flex items-center justify-between px-3 py-2 rounded-lg mb-1" style={{ background: "hsl(0,0%,13%)" }}>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "hsl(0,0%,38%)" }}>Admin</p>
              <p className="text-sm font-medium text-white truncate">{auth?.username ?? "Admin"}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-shrink-0 rounded-md hover:bg-red-500/20"
              style={{ color: "hsl(0,0%,50%)" }}
              onClick={handleLogout}
              disabled={logout.isPending}
              data-testid="button-logout"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex-shrink-0 h-12 flex items-center px-6 gap-3 border-b border-border bg-card">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: "hsl(0,80%,50%)", boxShadow: "0 0 6px hsl(0,80%,50%)" }}
          />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {NAV_ITEMS.find(n => n.href === "/" ? location === "/" : location.startsWith(n.href))?.label ?? "DTH Manager"}
          </p>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
