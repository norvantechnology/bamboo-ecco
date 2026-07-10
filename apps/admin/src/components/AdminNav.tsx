import { NavLink } from "react-router-dom";
import { cn } from "../lib/utils";
import { dashboardNav, navGroups, type NavItem } from "../lib/admin-nav";

function NavItemLink({
  item,
  onNavigate,
  mobile,
}: {
  item: NavItem;
  onNavigate?: () => void;
  mobile?: boolean;
}) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      onClick={onNavigate}
      title={item.description}
      className={({ isActive }) =>
        cn(
          "motion-tab flex items-center gap-3 rounded-lg px-3 font-medium transition-all duration-150",
          mobile ? "h-11 text-base" : "h-10 text-sm",
          isActive
            ? "bg-accent/10 text-foreground"
            : "text-muted hover:bg-background hover:text-foreground",
        )
      }
    >
      <Icon className={cn("shrink-0", mobile ? "h-5 w-5" : "h-4 w-4")} />
      <span className="truncate">{item.label}</span>
    </NavLink>
  );
}

export function AdminNav({ onNavigate, mobile }: { onNavigate?: () => void; mobile?: boolean }) {
  return (
    <div className={cn("space-y-5", mobile ? "p-3" : "p-3 pt-4")}>
      <div>
        <NavItemLink item={dashboardNav} onNavigate={onNavigate} mobile={mobile} />
      </div>

      {navGroups.map((group) => (
        <div key={group.id}>
          <p
            className={cn(
              "mb-1.5 px-3 font-semibold uppercase tracking-wider text-muted",
              mobile ? "text-xs" : "text-[10px]",
            )}
          >
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => (
              <NavItemLink key={item.to} item={item} onNavigate={onNavigate} mobile={mobile} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
