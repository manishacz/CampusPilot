import { NavLink } from "react-router-dom";
import { LayoutDashboard, CheckSquare, CalendarDays, FileText, User } from "lucide-react";
import { cn } from "@/lib/utils.js";
import { useLocale } from "../../context/LocaleContext.jsx";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, labelKey: "dashboard" },
  { to: "/tasks", icon: CheckSquare, labelKey: "tasks" },
  { to: "/weekly", icon: CalendarDays, labelKey: "weekly" },
  { to: "/documents", icon: FileText, labelKey: "documents" },
  { to: "/profile", icon: User, labelKey: "profile" },
];

export function MobileNav() {
  const { t } = useLocale();

  return (
    <nav className="md:hidden flex items-center justify-around h-12 border-t border-border bg-background px-1 shrink-0">
      {NAV_ITEMS.map(({ to, icon: Icon, labelKey }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-md text-[10px] transition-colors min-w-[48px]",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )
          }
        >
          <Icon className="size-4" />
          <span className="truncate max-w-[56px]">{t[labelKey]}</span>
        </NavLink>
      ))}
    </nav>
  );
}
