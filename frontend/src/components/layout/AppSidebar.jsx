import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  CalendarDays,
  FileText,
  User,
  Navigation,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils.js";
import { Button } from "@/components/ui/button.js";
import { Separator } from "@/components/ui/separator.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useLocale } from "../../context/LocaleContext.jsx";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, labelKey: "dashboard" },
  { to: "/tasks", icon: CheckSquare, labelKey: "tasks" },
  { to: "/weekly", icon: CalendarDays, labelKey: "weekly" },
  { to: "/documents", icon: FileText, labelKey: "documents" },
  { to: "/profile", icon: User, labelKey: "profile" },
];

export function AppSidebar({ collapsed, onToggle }) {
  const { logout, user } = useAuth();
  const { t } = useLocale();
  const location = useLocation();

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-200",
        collapsed ? "w-14" : "w-52"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center h-12 px-3 gap-2 border-b border-sidebar-border", collapsed && "justify-center px-0")}>
        <div className="flex items-center justify-center w-6 h-6 rounded bg-primary shrink-0">
          <Navigation className="size-3.5 text-primary-foreground" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <span className="font-medium text-sm tracking-tight text-sidebar-foreground">
            CampusPilot
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 flex flex-col gap-px">
        {NAV_ITEMS.map(({ to, icon: Icon, labelKey }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors",
                "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                isActive && "text-foreground bg-muted font-medium",
                collapsed && "justify-center px-0"
              )
            }
            title={collapsed ? t[labelKey] : undefined}
          >
            <Icon className="size-3.5 shrink-0" />
            {!collapsed && <span>{t[labelKey]}</span>}
          </NavLink>
        ))}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* User + logout */}
      <div className={cn("p-2 flex flex-col gap-px", collapsed && "items-center")}>
        {!collapsed && user && (
          <div className="flex items-center gap-2 px-2 py-1.5 mb-0.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary shrink-0">
              <span className="text-[10px] font-semibold text-primary-foreground uppercase">
                {user.name
                  ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)
                  : user.email?.[0]?.toUpperCase() ?? "?"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">{user.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          className={cn(
            "w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5",
            collapsed && "w-8 h-8 justify-center"
          )}
          onClick={logout}
          title={t.logout}
        >
          <LogOut className="size-3.5" />
          {!collapsed && <span className="text-[13px]">{t.logout}</span>}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "w-full flex items-center justify-end text-muted-foreground/50 hover:text-foreground hover:bg-transparent",
            collapsed ? "w-8 h-8 justify-center" : "h-6"
          )}
          onClick={onToggle}
          title="Toggle sidebar"
        >
          <ChevronLeft className={cn("size-3 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>
    </aside>
  );
}
