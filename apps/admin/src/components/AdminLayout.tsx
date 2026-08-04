import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { AdminNav } from "./AdminNav";
import { AdminSearch } from "./AdminSearch";
import { findNavItem } from "../lib/admin-nav";
import { clearStoredAuth, getStoredUser } from "../lib/api";
import { MotionDrawer, MotionOverlay, useMotionPresence } from "./ui/motion";

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("admin_sidebar_collapsed") === "true";
  });
  const { mounted: sidebarMounted, visible: sidebarVisible } = useMotionPresence(sidebarOpen);
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();
  const currentPage = findNavItem(location.pathname);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("admin_sidebar_collapsed", String(next));
  }

  function logout() {
    clearStoredAuth();
    navigate("/login");
  }

  return (
    <div className="flex min-h-dvh bg-background">
      <aside
        className={`hidden shrink-0 flex-col border-r border-border bg-surface transition-all duration-300 ease-in-out lg:flex ${
          collapsed ? "w-16" : "w-52"
        }`}
      >
        <div className="border-b border-border px-3 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/brand/icon.svg"
              alt=""
              aria-hidden
              className="h-8 w-8 shrink-0 rounded-full"
            />
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-tight">Bamboo Eco-Hub</p>
                <p className="text-[10px] text-muted leading-none">Admin Panel</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={toggleCollapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="p-1 rounded-md text-muted hover:text-foreground hover:bg-background/80 transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto overflow-x-hidden">
          <AdminNav collapsed={collapsed} />
        </nav>
        <div className="border-t border-border p-2">
          <button
            type="button"
            onClick={logout}
            title="Sign out"
            className={`motion-pop flex h-9 w-full items-center gap-2.5 rounded-lg text-xs text-muted hover:bg-background hover:text-foreground transition-all ${
              collapsed ? "justify-center px-0" : "px-2.5"
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {sidebarMounted && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <MotionOverlay visible={sidebarVisible} onClick={() => setSidebarOpen(false)} />
          <MotionDrawer
            visible={sidebarVisible}
            className="absolute left-0 top-0 flex h-full w-[min(85vw,300px)] flex-col bg-surface shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <img
                  src="/brand/icon.svg"
                  alt=""
                  aria-hidden
                  className="h-8 w-8 shrink-0 rounded-full"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold tracking-tight">Bamboo Eco-Hub</p>
                  <p className="text-xs text-muted">Shop · Website · Settings</p>
                </div>
              </div>
              <button
                type="button"
                className="motion-pop flex h-10 w-10 items-center justify-center"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="border-b border-border p-3">
              <AdminSearch />
            </div>
            <nav className="flex-1 overflow-y-auto">
              <AdminNav onNavigate={() => setSidebarOpen(false)} mobile />
            </nav>
            <div className="border-t border-border p-3">
              <button
                type="button"
                onClick={logout}
                className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-base text-muted hover:bg-background"
              >
                <LogOut className="h-5 w-5" />
                Sign out
              </button>
            </div>
          </MotionDrawer>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur sm:gap-4 sm:px-6">
          <button
            type="button"
            className="motion-pop flex h-10 w-10 shrink-0 items-center justify-center lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            {currentPage && (
              <div className="lg:hidden">
                <p className="truncate text-sm font-semibold">{currentPage.label}</p>
              </div>
            )}
            <div className="hidden lg:block">
              <AdminSearch />
            </div>
          </div>

          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium">{user?.firstName ?? "Admin"}</p>
            <p className="max-w-[180px] truncate text-xs text-muted">{user?.email}</p>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6">
          {/* Remount on each navigation so pages always refetch fresh API data */}
          <Outlet key={location.key} />
        </main>
      </div>
    </div>
  );
}
