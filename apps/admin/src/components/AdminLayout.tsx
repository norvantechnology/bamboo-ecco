import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import { AdminNav } from "./AdminNav";
import { AdminSearch } from "./AdminSearch";
import { findNavItem } from "../lib/admin-nav";
import { clearStoredAuth, getStoredUser } from "../lib/api";
import { MotionDrawer, MotionOverlay, useMotionPresence } from "./ui/motion";

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { mounted: sidebarMounted, visible: sidebarVisible } = useMotionPresence(sidebarOpen);
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();
  const currentPage = findNavItem(location.pathname);

  function logout() {
    clearStoredAuth();
    navigate("/login");
  }

  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <div className="border-b border-border px-5 py-4">
          <p className="font-semibold tracking-tight">Ecoo Admin</p>
          <p className="mt-0.5 text-xs text-muted">Manage your store in one place</p>
        </div>
        <nav className="flex-1 overflow-y-auto">
          <AdminNav />
        </nav>
        <div className="border-t border-border p-3">
          <button
            type="button"
            onClick={logout}
            className="motion-pop flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-muted hover:bg-background hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
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
              <div>
                <p className="font-semibold">Menu</p>
                <p className="text-xs text-muted">Shop · Website · Settings</p>
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
