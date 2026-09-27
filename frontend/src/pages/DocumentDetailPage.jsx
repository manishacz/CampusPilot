import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  FileSpreadsheet,
  FileImage,
  Presentation,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Loader2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils.js";
import { Button } from "@/components/ui/button.js";
import { Skeleton } from "@/components/ui/skeleton.js";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.js";
import { documentService } from "../services/documentService.js";
import { taskService } from "../services/taskService.js";
import { TaskList } from "../components/tasks/TaskList.jsx";
import { SourceViewer } from "../components/source/SourceViewer.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useLocale } from "../context/LocaleContext.jsx";

const FILE_ICONS = {
  pdf: FileText, docx: FileText, doc: FileText,
  xlsx: FileSpreadsheet, xls: FileSpreadsheet,
  pptx: Presentation, ppt: Presentation,
  png: FileImage, jpg: FileImage, jpeg: FileImage,
};

const STATUS_CONFIG = {
  uploading: { label: "Uploading", icon: Loader2, className: "text-primary" },
  processing: { label: "Processing", icon: Loader2, className: "text-primary" },
  ready: { label: "Ready", icon: CheckCircle2, className: "text-success" },
  failed: { label: "Failed", icon: XCircle, className: "text-destructive" },
};

export function DocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLocale();
  const [doc, setDoc] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sourceTask, setSourceTask] = useState(null);
  const [sourceOpen, setSourceOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [document, allTasks] = await Promise.all([
        documentService.getDocument(id),
        taskService.getTasks(),
      ]);
      setDoc(document);
      setTasks(allTasks.filter((task) => task.source_ref?.document_id === id || task.document_id === id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (doc?.status !== "processing") return;
    const interval = setInterval(() => {
      load();
    }, 2500);
    return () => clearInterval(interval);
  }, [doc?.status, load]);

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

  const Icon = doc ? (FILE_ICONS[doc.type] || FileText) : FileText;
  const status = doc ? (STATUS_CONFIG[doc.status] || STATUS_CONFIG.ready) : null;
  const StatusIcon = status?.icon;
  const isAnimating = doc?.status === "processing" || doc?.status === "uploading";

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/documents")} className="mb-1 -ml-2">
          <ArrowLeft className="size-3.5" /> Back
        </Button>
      </div>

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      )}

      {error && !loading && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Couldn't load document</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw className="size-3" /> Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!loading && !error && doc && (
        <>
          {/* Document header — flat, no card */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <Icon className="size-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold tracking-tight truncate">{doc.filename}</h2>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs text-muted-foreground">
                  <span className={cn("inline-flex items-center gap-1", status.className)}>
                    <StatusIcon className={cn("size-3", isAnimating && "animate-spin")} />
                    {status.label}
                  </span>
                  <span className="text-muted-foreground/40">·</span>
                  <span>{new Date(doc.uploaded_at).toLocaleDateString("en-US", { dateStyle: "medium" })}</span>
                  {doc.pages && (
                    <>
                      <span className="text-muted-foreground/40">·</span>
                      <span>{doc.pages} pages</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {doc.status === "processing" && (
              <div className="mt-3 flex items-center gap-2 text-sm text-primary">
                <Loader2 className="size-3.5 animate-spin" />
                {t.processing}
              </div>
            )}

            {doc.status === "failed" && (
              <Alert variant="destructive" className="mt-3">
                <AlertCircle className="size-4" />
                <AlertDescription>We couldn't process this document.</AlertDescription>
              </Alert>
            )}
          </div>

          {doc.status === "ready" && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Extracted tasks ({tasks.length})
              </h3>
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No tasks were extracted from this document.</p>
              ) : (
                <TaskList
                  tasks={tasks}
                  onComplete={handleComplete}
                  onViewSource={handleViewSource}
                />
              )}
            </div>
          )}
        </>
      )}

      <SourceViewer task={sourceTask} open={sourceOpen} onOpenChange={setSourceOpen} />
    </div>
  );
}
