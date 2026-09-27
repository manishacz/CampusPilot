import { useLocation } from "react-router-dom";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.js";
import { useTheme } from "@/components/theme-provider.js";
import { LanguageToggle } from "../localization/LanguageToggle.jsx";
import { useAuth } from "../../hooks/useAuth.js";

const ROUTE_TITLES = {
  "/dashboard": "Dashboard",
  "/tasks": "All Tasks",
  "/weekly": "This Week",
  "/documents": "Documents",
  "/profile": "Profile",
};

export function TopBar() {
  const { pathname } = useLocation();
  const { setTheme } = useTheme();
  const { user } = useAuth();

  const title = ROUTE_TITLES[pathname] || "CampusPilot";

  return (
    <header className="flex items-center justify-between h-12 px-4 md:px-6 border-b border-border bg-background shrink-0">
      <h1 className="text-sm font-medium tracking-tight">{title}</h1>

      <div className="flex items-center gap-1">
        <LanguageToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Toggle theme">
              <Sun className="size-3.5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
              <Moon className="absolute size-3.5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="size-3" /> Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="size-3" /> Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Monitor className="size-3" /> System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {user && (
          <div className="hidden sm:flex items-center gap-2 pl-2 ml-1 border-l border-border">
            <div className="flex items-center justify-center size-6 rounded-full bg-muted text-xs font-medium text-muted-foreground">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
