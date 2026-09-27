import { useState } from "react";
import {
  Calendar,
  GraduationCap,
  ListChecks,
  FileText,
  Check,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils.js";
import { Button } from "@/components/ui/button.js";
import { Separator } from "@/components/ui/separator.js";
import { PriorityBadge } from "./PriorityBadge.jsx";
import { TaskStatus } from "./TaskStatus.jsx";
import { ConfidenceIndicator, CONFIDENCE_CONFIG } from "../source/ConfidenceIndicator.jsx";
import { useLocale } from "../../context/LocaleContext.jsx";

const CATEGORY_ICONS = {
  placement: GraduationCap,
  scholarship: FileText,
  exam: ListChecks,
  hostel: FileText,
  event: Calendar,
};

function formatDeadline(iso) {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = date - now;
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffHours / 24;

  if (diffHours < 0) return { label: "Overdue", urgent: true };
  if (diffHours < 24) {
    const h = Math.ceil(diffHours);
    return { label: `${h}h left`, urgent: true };
  }
  if (diffDays < 2) return { label: "Tomorrow", urgent: true };
  if (diffDays < 7) return { label: `${Math.ceil(diffDays)}d left`, urgent: false };
  return {
    label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    urgent: false,
  };
}

export function TaskCard({ task, variant = "default", onComplete, onViewSource }) {
  const { t } = useLocale();
  const [completing, setCompleting] = useState(false);
  const Icon = CATEGORY_ICONS[task.category] || FileText;
  const deadline = formatDeadline(task.deadline);
  const isCompleted = task.status === "completed";
  const lowConfidence = task.confidence === "low";
  const mediumConfidence = task.confidence === "medium";

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await onComplete?.(task.task_id);
    } finally {
      setCompleting(false);
    }
  };

  // Primary variant — the "Do this now" card
  if (variant === "primary") {
    return (
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-stretch">
          <PriorityBadge priority={task.priority} variant="bar" />
          <div className="flex-1 p-4 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="size-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                {t.categories[task.category]}
              </span>
              <span className="text-xs text-muted-foreground">·</span>
              <PriorityBadge priority={task.priority} />
              <div className="ml-auto">
                <TaskStatus status={task.status} />
              </div>
            </div>

            <h3 className="text-base font-semibold tracking-tight mb-1.5">
              {task.title}
            </h3>

            {task.justification && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                {task.justification}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3 flex-wrap">
              <span className={cn(
                "inline-flex items-center gap-1",
                deadline.urgent && !isCompleted && "text-critical font-medium"
              )}>
                <Calendar className="size-3" />
                {deadline.label}
              </span>
              {task.eligibility && (
                <span className="inline-flex items-center gap-1">
                  <GraduationCap className="size-3" />
                  {task.eligibility.branches?.join(", ") || "All branches"}
                  {task.eligibility.graduation_year && ` · ${task.eligibility.graduation_year}`}
                </span>
              )}
              <ConfidenceIndicator confidence={task.confidence} showLabel={false} />
            </div>

            {task.requirements?.length > 0 && (
              <div className="mb-3">
                <ul className="space-y-0.5">
                  {task.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="size-1 rounded-full bg-muted-foreground/50 mt-1.5 shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              {task.source_ref && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewSource?.(task)}
                >
                  <FileText className="size-3.5" />
                  {t.viewSource}
                </Button>
              )}
              {!isCompleted && (
                <Button
                  size="sm"
                  onClick={handleComplete}
                  disabled={completing}
                >
                  <Check className="size-3.5" />
                  {completing ? "Completing..." : t.markComplete}
                </Button>
              )}
            </div>

            {(lowConfidence || mediumConfidence) && (
              <div className="flex items-center gap-1.5 mt-3 text-xs text-warning-foreground">
                <AlertTriangle className="size-3 shrink-0" />
                {CONFIDENCE_CONFIG[task.confidence].warning}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default — dense scannable row
  return (
    <div
      className={cn(
        "group flex items-stretch transition-colors hover:bg-muted/40",
        isCompleted && "opacity-50"
      )}
    >
      <PriorityBadge priority={task.priority} variant="bar" />
      <div className="flex-1 flex items-center gap-3 px-3 py-2.5 min-w-0">
        <Icon className="size-3.5 text-muted-foreground shrink-0 hidden sm:block" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <h4 className={cn(
              "text-sm font-medium truncate",
              isCompleted && "line-through text-muted-foreground"
            )}>
              {task.title}
            </h4>
          </div>
          <div className="flex items-center gap-2.5 mt-0.5 text-xs text-muted-foreground">
            <span className="capitalize">{t.categories[task.category]}</span>
            <span className="text-muted-foreground/40">·</span>
            <span className={cn(
              "inline-flex items-center gap-0.5",
              deadline.urgent && !isCompleted && "text-critical font-medium"
            )}>
              {deadline.label}
            </span>
            <ConfidenceIndicator confidence={task.confidence} showLabel={false} />
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <TaskStatus status={task.status} />
          {!isCompleted && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleComplete}
              disabled={completing}
              title={t.markComplete}
            >
              <Check className="size-3.5" />
            </Button>
          )}
          {task.source_ref && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onViewSource?.(task)}
              title={t.viewSource}
            >
              <FileText className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
