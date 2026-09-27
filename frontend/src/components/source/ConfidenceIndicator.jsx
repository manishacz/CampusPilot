import { cn } from "@/lib/utils";

const CONFIDENCE_CONFIG = {
  high: {
    label: "High confidence",
    dot: "bg-success",
    text: "text-success",
    warning: null,
  },
  medium: {
    label: "Medium confidence",
    dot: "bg-warning",
    text: "text-warning-foreground",
    warning: "Some information may need verification.",
  },
  low: {
    label: "Verify manually",
    dot: "bg-critical",
    text: "text-critical",
    warning: "This extraction has low confidence. Please verify the details manually.",
  },
};

export function ConfidenceIndicator({ confidence, showLabel = true, size = "sm" }) {
  const config = CONFIDENCE_CONFIG[confidence] || CONFIDENCE_CONFIG.medium;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        size === "sm" ? "text-xs" : "text-sm",
        config.text
      )}
    >
      <span className={cn("size-2 rounded-full", config.dot)} />
      {showLabel && <span className="font-medium">{config.label}</span>}
    </span>
  );
}

export { CONFIDENCE_CONFIG };
