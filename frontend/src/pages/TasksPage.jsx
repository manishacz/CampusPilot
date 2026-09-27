import { useState, useEffect, useCallback, useMemo } from "react";
import { AlertCircle, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button.js";
import { Input } from "@/components/ui/input.js";
import { Skeleton } from "@/components/ui/skeleton.js";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.js";
import { Empty, EmptyContent, EmptyTitle, EmptyDescription } from "@/components/ui/empty.js";
import { TaskList } from "../components/tasks/TaskList.jsx";
import { TaskFilters } from "../components/tasks/TaskFilters.jsx";
import { SourceViewer } from "../components/source/SourceViewer.jsx";
import { taskService } from "../services/taskService.js";
import { useLocale } from "../context/LocaleContext.jsx";

export function TasksPage() {
  const { t } = useLocale();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ priority: "all", category: "all", status: "all" });
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

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filters.priority !== "all" && task.priority !== filters.priority) return false;
      if (filters.category !== "all" && task.category !== filters.category) return false;
      if (filters.status !== "all" && task.status !== filters.status) return false;
      if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tasks, filters, search]);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">All Tasks</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Everything CampusPilot has extracted for you.</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <TaskFilters filters={filters} onChange={setFilters} />
      </div>

      {loading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      )}

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

      {!loading && !error && filteredTasks.length === 0 && (
        <Empty className="py-16">
          <EmptyContent>
            <EmptyTitle>{t.noTasks}</EmptyTitle>
            <EmptyDescription>No tasks match your current filters.</EmptyDescription>
          </EmptyContent>
        </Empty>
      )}

      {!loading && !error && filteredTasks.length > 0 && (
        <TaskList
          tasks={filteredTasks}
          onComplete={handleComplete}
          onViewSource={handleViewSource}
        />
      )}

      <SourceViewer task={sourceTask} open={sourceOpen} onOpenChange={setSourceOpen} />
    </div>
  );
}
