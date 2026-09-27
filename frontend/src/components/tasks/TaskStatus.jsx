import { Check, Clock, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    icon: Circle,
    className: "text-muted-foreground",
    dot: "bg-muted-foreground/50",
  },
  in_progress: {
    label: "In Progress",
    icon: Clock,
    className: "text-warning-foreground",
    dot: "bg-warning",
  },
  completed: {
    label: "Completed",
    icon: Check,
    className: "text-success",
    dot: "bg-success",
  },
};

export function TaskStatus({ status, variant = "badge" }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;

  if (variant === "dot") {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className={cn("size-1.5 rounded-full", config.dot)} />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        config.className
      )}
    >
      <Icon className="size-3" />
      {config.label}
    </span>
  );
}

export { STATUS_CONFIG };
