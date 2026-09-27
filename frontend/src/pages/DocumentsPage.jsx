import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
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
import { Empty, EmptyContent, EmptyTitle, EmptyDescription, EmptyMedia } from "@/components/ui/empty.js";
import { UploadPanel } from "../components/upload/UploadPanel.jsx";
import { documentService } from "../services/documentService.js";
import { useLocale } from "../context/LocaleContext.jsx";

const FILE_ICONS = {
  pdf: FileText,
  docx: FileText,
  doc: FileText,
  xlsx: FileSpreadsheet,
  xls: FileSpreadsheet,
  pptx: Presentation,
  ppt: Presentation,
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
};

const STATUS_CONFIG = {
  uploading: { label: "Uploading", icon: Loader2, className: "text-primary", dot: "bg-primary" },
  processing: { label: "Processing", icon: Loader2, className: "text-primary", dot: "bg-primary" },
  ready: { label: "Ready", icon: CheckCircle2, className: "text-success", dot: "bg-success" },
  failed: { label: "Failed", icon: XCircle, className: "text-destructive", dot: "bg-destructive" },
};

export function DocumentsPage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await documentService.getDocuments();
      setDocuments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === "processing");
    if (!hasProcessing) return;
    const interval = setInterval(() => {
      loadDocuments();
    }, 2000);
    return () => clearInterval(interval);
  }, [documents, loadDocuments]);

  const handleUploaded = useCallback(() => {
    setShowUpload(false);
    loadDocuments();
  }, [loadDocuments]);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Documents</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Campus notices and documents you've uploaded.</p>
        </div>
        <Button
          size="sm"
          variant={showUpload ? "outline" : "default"}
          onClick={() => setShowUpload((s) => !s)}
        >
          {showUpload ? "Cancel" : t.uploadDocument}
        </Button>
      </div>

      {showUpload && (
        <UploadPanel onUploaded={handleUploaded} />
      )}

      {loading && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      )}

      {error && !loading && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Couldn't load documents</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={loadDocuments}>
              <RefreshCw className="size-3" /> Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!loading && !error && documents.length === 0 && (
        <Empty className="py-16">
          <EmptyContent>
            <EmptyMedia variant="icon">
              <FileText className="size-5" />
            </EmptyMedia>
            <EmptyTitle>{t.noDocuments}</EmptyTitle>
            <EmptyDescription>Upload a campus notice or document to get started.</EmptyDescription>
          </EmptyContent>
        </Empty>
      )}

      {!loading && !error && documents.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden bg-card">
          {documents.map((doc, i) => {
            const Icon = FILE_ICONS[doc.type] || FileText;
            const status = STATUS_CONFIG[doc.status] || STATUS_CONFIG.ready;
            const StatusIcon = status.icon;
            const isAnimating = doc.status === "processing" || doc.status === "uploading";

            return (
              <div
                key={doc.document_id}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors hover:bg-muted/40",
                  i > 0 && "border-t border-border"
                )}
                onClick={() => navigate(`/documents/${doc.document_id}`)}
              >
                <Icon className="size-4 text-muted-foreground shrink-0" />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.filename}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <span className={cn("inline-flex items-center gap-1", status.className)}>
                      <StatusIcon className={cn("size-3", isAnimating && "animate-spin")} />
                      {status.label}
                    </span>
                    <span className="text-muted-foreground/40">·</span>
                    <span>{new Date(doc.uploaded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    {doc.pages && (
                      <>
                        <span className="text-muted-foreground/40">·</span>
                        <span>{doc.pages}p</span>
                      </>
                    )}
                  </div>
                </div>

                {doc.tasks_generated > 0 && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {doc.tasks_generated} task{doc.tasks_generated !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
