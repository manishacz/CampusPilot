import { cn } from "@/lib/utils";

const PRIORITY_CONFIG = {
  high: {
    label: "High",
    dot: "bg-critical",
    text: "text-critical",
    bar: "bg-critical",
    labelKey: "priority.high",
    value: "high",
    rank: 0,
  },
  medium: {
    label: "Medium",
    dot: "bg-warning",
    text: "text-warning-foreground",
    bar: "bg-warning",
    labelKey: "priority.medium",
    value: "medium",
    rank: 1,
  },
  low: {
    label: "Low",
    dot: "bg-muted-foreground",
    text: "text-muted-foreground",
    bar: "bg-muted-foreground/40",
    labelKey: "priority.low",
    value: "low",
    rank: 2,
  },
};

export function PriorityBadge({ priority, variant = "badge" }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;

  if (variant === "dot") {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className={cn("size-1.5 rounded-full", config.dot)} />
      </span>
    );
  }

  if (variant === "bar") {
    return <span className={cn("block h-full w-0.5 shrink-0", config.bar)} />;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        config.text
      )}
    >
      <span className={cn("size-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}

export { PRIORITY_CONFIG };
