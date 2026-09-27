import { useState, useEffect, useCallback, useMemo } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button.js";
import { Skeleton } from "@/components/ui/skeleton.js";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.js";
import { Empty, EmptyContent, EmptyTitle, EmptyDescription } from "@/components/ui/empty.js";
import { TaskList } from "../components/tasks/TaskList.jsx";
import { SourceViewer } from "../components/source/SourceViewer.jsx";
import { taskService } from "../services/taskService.js";
import { useLocale } from "../context/LocaleContext.jsx";

function getGroupLabel(date) {
  const now = new Date();
  const taskDate = new Date(date);
  const diffMs = taskDate - now;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const today = now.toDateString();
  const tomorrow = new Date(now.getTime() + 86400000).toDateString();
  const taskDay = taskDate.toDateString();

  if (taskDay === today) return "Today";
  if (taskDay === tomorrow) return "Tomorrow";
  if (diffDays >= 2 && diffDays < 7) return "This week";
  if (diffDays >= 7) return "Later";
  return "This week";
}

export function WeeklyPage() {
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

  const grouped = useMemo(() => {
    const active = tasks.filter((t) => t.status !== "completed");
    const groups = { Today: [], Tomorrow: [], "This week": [], Later: [] };
    active.forEach((task) => {
      const label = getGroupLabel(task.deadline);
      groups[label]?.push(task);
    });
    Object.values(groups).forEach((g) =>
      g.sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    );
    return groups;
  }, [tasks]);

  const groupOrder = ["Today", "Tomorrow", "This week", "Later"];
  const hasAny = groupOrder.some((g) => grouped[g]?.length > 0);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">This Week</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your upcoming campus actions, organized by urgency.
        </p>
      </div>

      {loading && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      )}

      {error && !loading && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Couldn't load your week</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={loadTasks}>
              <RefreshCw className="size-3" /> Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!loading && !error && !hasAny && (
        <Empty className="py-16">
          <EmptyContent>
            <EmptyTitle>{t.noTasks}</EmptyTitle>
            <EmptyDescription>You have no pending tasks this week.</EmptyDescription>
          </EmptyContent>
        </Empty>
      )}

      {!loading && !error && hasAny && (
        <div className="space-y-5">
          {groupOrder.map((label) => {
            if (!grouped[label]?.length) return null;
            return (
              <div key={label}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-medium text-muted-foreground">{label}</span>
                  <span className="text-xs text-muted-foreground/50">({grouped[label].length})</span>
                </div>
                <TaskList
                  tasks={grouped[label]}
                  onComplete={handleComplete}
                  onViewSource={handleViewSource}
                />
              </div>
            );
          })}
        </div>
      )}

      <SourceViewer task={sourceTask} open={sourceOpen} onOpenChange={setSourceOpen} />
    </div>
  );
}
