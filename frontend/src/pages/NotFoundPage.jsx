import { Link } from "react-router-dom";
import { Navigation, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center px-4 bg-background">
      <div className="flex items-center justify-center w-10 h-10 rounded bg-primary mb-5">
        <Navigation className="size-5 text-primary-foreground" strokeWidth={2.5} />
      </div>
      <h1 className="text-3xl font-bold tracking-tight mb-1.5">404</h1>
      <p className="text-sm text-muted-foreground mb-5">This page doesn't exist.</p>
      <Button asChild size="sm">
        <Link to="/dashboard">
          <Home className="size-3.5" />
          Back to dashboard
        </Link>
      </Button>
    </div>
  );
}
