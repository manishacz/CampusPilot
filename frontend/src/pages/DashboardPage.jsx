import { useState, useEffect, useMemo, useCallback } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  ListTodo,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils.js";
import { Button } from "@/components/ui/button.js";
import { Skeleton } from "@/components/ui/skeleton.js";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.js";
import { Empty, EmptyDescription, EmptyTitle, EmptyContent } from "@/components/ui/empty.js";
import { TaskCard } from "../components/tasks/TaskCard.jsx";
import { TaskList } from "../components/tasks/TaskList.jsx";
import { SourceViewer } from "../components/source/SourceViewer.jsx";
import { taskService } from "../services/taskService.js";
import { useAuth } from "../hooks/useAuth.js";
import { useLocale } from "../context/LocaleContext.jsx";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatGroupLabel(date) {
  const now = new Date();
  const taskDate = new Date(date);
  const diffDays = Math.floor((taskDate - now) / (1000 * 60 * 60 * 24));
  const today = now.toDateString();
  const tomorrow = new Date(now.getTime() + 86400000).toDateString();
  const taskDay = taskDate.toDateString();

  if (taskDay === today) return "Today";
  if (taskDay === tomorrow) return "Tomorrow";
  if (diffDays < 7) return "This week";
  return "Later";
}

export function DashboardPage() {
  const { user } = useAuth();
  const { t } = useLocale();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sourceTask, setSourceTask] = useState(null);
  const [sourceOpen, setSourceOpen] = useState(false);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await taskService.getTasks();
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleComplete = useCallback(async (taskId) => {
    await taskService.completeTask(taskId);
    setTasks((prev) =>
      prev.map((t) => (t.task_id === taskId ? { ...t, status: "completed" } : t))
    );
  }, []);

  const handleViewSource = useCallback((task) => {
    setSourceTask(task);
    setSourceOpen(true);
  }, []);

  const { activeTasks, completedCount, urgentCount, dueSoonCount, primaryTask, upcomingTasks, weekGroups } = useMemo(() => {
    const active = tasks.filter((t) => t.status !== "completed");
    const completed = tasks.filter((t) => t.status === "completed");
    const now = new Date();
    const urgent = active.filter((t) => {
      const diff = new Date(t.deadline) - now;
      return diff < 24 * 60 * 60 * 1000 && t.priority === "high";
    }).length;
    const dueSoon = active.filter((t) => {
      const diff = new Date(t.deadline) - now;
      return diff < 3 * 24 * 60 * 60 * 1000;
    }).length;

    const sorted = [...active].sort((a, b) => {
      const pOrder = { high: 0, medium: 1, low: 2 };
      const pDiff = (pOrder[a.priority] ?? 2) - (pOrder[b.priority] ?? 2);
      if (pDiff !== 0) return pDiff;
      return new Date(a.deadline) - new Date(b.deadline);
    });

    const primary = sorted[0] || null;
    const upcoming = sorted.slice(1, 4);

    const groups = {};
    sorted.slice(1).forEach((task) => {
      const label = formatGroupLabel(task.deadline);
      if (!groups[label]) groups[label] = [];
      groups[label].push(task);
    });
    const groupOrder = ["Today", "Tomorrow", "This week", "Later"];
    const orderedGroups = groupOrder
      .filter((g) => groups[g]?.length)
      .map((g) => ({ label: g, tasks: groups[g] }));

    return {
      activeTasks: active,
      completedCount: completed.length,
      urgentCount: urgent,
      dueSoonCount: dueSoon,
      primaryTask: primary,
      upcomingTasks: upcoming,
      weekGroups: orderedGroups,
    };
  }, [tasks]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Greeting + inline stats */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          {getGreeting()}, {user?.name?.split(" ")[0] || "there"}
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">Here's what needs your attention.</p>
      </div>

      {/* Inline summary — not four equal cards */}
      {!loading && !error && activeTasks.length > 0 && (
        <div className="flex items-center gap-4 text-xs">
          {urgentCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-critical font-medium">
              <AlertCircle className="size-3" />
              {urgentCount} urgent
            </span>
          )}
          {dueSoonCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-warning-foreground">
              <Clock className="size-3" />
              {dueSoonCount} due soon
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <ListTodo className="size-3" />
            {activeTasks.length} active
          </span>
          {completedCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-success">
              <CheckCircle2 className="size-3" />
              {completedCount} done
            </span>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Couldn't load tasks</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={loadTasks}>
              <RefreshCw className="size-3" /> Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {activeTasks.length === 0 && completedCount === 0 ? (
            <Empty className="py-16">
              <EmptyContent>
                <EmptyTitle>{t.noTasks}</EmptyTitle>
                <EmptyDescription>Upload a campus document to get started.</EmptyDescription>
              </EmptyContent>
            </Empty>
          ) : (
            <>
              {/* Do this now */}
              {primaryTask && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    {t.doThisNow}
                  </h3>
                  <TaskCard
                    task={primaryTask}
                    variant="primary"
                    onComplete={handleComplete}
                    onViewSource={handleViewSource}
                  />
                </div>
              )}

              {/* Coming up */}
              {upcomingTasks.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    {t.comingUp}
                  </h3>
                  <TaskList
                    tasks={upcomingTasks}
                    onComplete={handleComplete}
                    onViewSource={handleViewSource}
                  />
                </div>
              )}

              {/* This week grouped */}
              {weekGroups.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    {t.thisWeek}
                  </h3>
                  <div className="space-y-4">
                    {weekGroups.map((group) => (
                      <div key={group.label}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Calendar className="size-3 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">{group.label}</span>
                        </div>
                        <TaskList
                          tasks={group.tasks}
                          onComplete={handleComplete}
                          onViewSource={handleViewSource}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      <SourceViewer task={sourceTask} open={sourceOpen} onOpenChange={setSourceOpen} />
    </div>
  );
}
