import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { AppSidebar } from "./AppSidebar.jsx";
import { TopBar } from "./TopBar.jsx";
import { MobileNav } from "./MobileNav.jsx";
import { Spinner } from "@/components/ui/spinner.js";

export function AppLayout() {
  const { isAuthenticated, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Wait for the initial Supabase session check before deciding whether to redirect
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto px-4 py-5 md:px-6 lg:px-8">
          <Outlet />
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
