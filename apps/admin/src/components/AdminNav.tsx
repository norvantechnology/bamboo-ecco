import { NavLink } from "react-router-dom";
import { cn } from "../lib/utils";
import { dashboardNav, navGroups, type NavItem } from "../lib/admin-nav";

function NavItemLink({
  item,
  onNavigate,
  mobile,
  collapsed,
}: {
  item: NavItem;
  onNavigate?: () => void;
  mobile?: boolean;
  collapsed?: boolean;
}) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      onClick={onNavigate}
      title={collapsed ? `${item.label} — ${item.description}` : item.description}
      className={({ isActive }) =>
        cn(
          "motion-tab relative flex items-center rounded-lg font-medium transition-all duration-150 group",
          mobile ? "h-11 px-3 gap-3 text-base" : collapsed ? "h-10 w-10 justify-center mx-auto text-sm" : "h-9 px-2.5 gap-2.5 text-sm",
          isActive
            ? "bg-accent/15 text-foreground font-semibold shadow-xs border border-accent/20"
            : "text-muted hover:bg-background/80 hover:text-foreground",
        )
      }
    >
      <Icon className={cn("shrink-0 transition-transform duration-200 group-hover:scale-110", mobile ? "h-5 w-5" : "h-4 w-4")} />
      {!collapsed && <span className="truncate text-xs">{item.label}</span>}
      {collapsed && (
        <div className="absolute left-full ml-2.5 hidden group-hover:flex items-center z-50 pointer-events-none">
          <div className="bg-foreground text-background text-xs font-semibold px-2.5 py-1 rounded-md shadow-lg whitespace-nowrap">
            {item.label}
          </div>
        </div>
      )}
    </NavLink>
  );
}

export function AdminNav({ onNavigate, mobile, collapsed }: { onNavigate?: () => void; mobile?: boolean; collapsed?: boolean }) {
  return (
    <div className={cn("space-y-4", mobile ? "p-3" : collapsed ? "p-2 pt-3" : "p-2.5 pt-3")}>
      <div>
        <NavItemLink item={dashboardNav} onNavigate={onNavigate} mobile={mobile} collapsed={collapsed} />
      </div>

      {navGroups.map((group) => (
        <div key={group.id}>
          {!collapsed && (
            <p
              className={cn(
                "mb-1 px-2.5 font-bold uppercase tracking-widest text-muted/70",
                mobile ? "text-xs" : "text-[9px]",
              )}
            >
              {group.label}
            </p>
          )}
          <div className="space-y-0.5">
            {group.items.map((item) => (
              <NavItemLink key={item.to} item={item} onNavigate={onNavigate} mobile={mobile} collapsed={collapsed} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
