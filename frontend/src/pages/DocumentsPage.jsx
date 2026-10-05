import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  Eye,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils.js";
import { Button } from "@/components/ui/button.js";
import { Skeleton } from "@/components/ui/skeleton.js";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.js";
import { Empty, EmptyContent, EmptyTitle, EmptyDescription, EmptyMedia } from "@/components/ui/empty.js";
import { UploadPanel } from "../components/upload/UploadPanel.jsx";
import { documentService } from "../services/documentService.js";
import { useLocale } from "../context/LocaleContext.jsx";
import { useAuth } from "../hooks/useAuth.js";

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

const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "gif", "webp", "tif", "tiff"]);
const PDF_EXT = "pdf";
const OFFICE_EXTS = new Set(["docx", "doc", "xlsx", "xls", "pptx", "ppt"]);

function getExt(s3KeyOrFilename) {
  return (s3KeyOrFilename || "").split(".").pop().toLowerCase();
}

/** Renders the correct preview element given a presigned URL and file extension. */
function PreviewContent({ url, filename, zoom }) {
  const ext = getExt(filename);

  if (!url) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Preview not available in demo mode.
      </div>
    );
  }

  if (IMAGE_EXTS.has(ext)) {
    return (
      <div className="flex items-center justify-center h-full overflow-auto p-4 bg-checkerboard">
        <img
          src={url}
          alt={filename}
          style={{ transform: `scale(${zoom})`, transformOrigin: "center top", transition: "transform 0.2s" }}
          className="max-w-full rounded shadow-md"
        />
      </div>
    );
  }

  if (ext === PDF_EXT) {
    return (
      <iframe
        src={`${url}#zoom=${Math.round(zoom * 100)}`}
        title={filename}
        className="w-full h-full border-0 rounded"
        style={{ transform: `scale(${zoom})`, transformOrigin: "top left", width: `${100 / zoom}%`, height: `${100 / zoom}%` }}
      />
    );
  }

  if (OFFICE_EXTS.has(ext)) {
    // Google Docs Viewer for Office formats — requires the URL to be publicly reachable.
    // For S3 presigned URLs this works as long as the bucket allows the viewer's IP.
    const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    return (
      <iframe
        src={viewerUrl}
        title={filename}
        className="w-full h-full border-0 rounded"
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground text-sm">
      <FileText className="size-10 opacity-30" />
      <span>No inline preview available for this file type.</span>
      <a href={url} target="_blank" rel="noopener noreferrer" download={filename}>
        <Button size="sm" variant="outline">
          <Download className="size-3.5" /> Download
        </Button>
      </a>
    </div>
  );
}

/** Full-screen preview modal */
function PreviewModal({ doc, onClose }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loadingUrl, setLoadingUrl] = useState(true);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoadingUrl(true);
    documentService.getPreviewUrl(doc.document_id)
      .then((res) => { if (!cancelled) setPreviewUrl(res?.preview_url || null); })
      .catch(() => { if (!cancelled) setPreviewUrl(null); })
      .finally(() => { if (!cancelled) setLoadingUrl(false); });
    return () => { cancelled = true; };
  }, [doc.document_id]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Preview: ${doc.filename}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
        <FileText className="size-4 text-muted-foreground shrink-0" />
        <span className="flex-1 text-sm font-medium truncate">{doc.filename}</span>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
            title="Zoom out"
          >
            <ZoomOut className="size-3.5" />
          </Button>
          <span className="text-xs text-muted-foreground w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            title="Zoom in"
          >
            <ZoomIn className="size-3.5" />
          </Button>
        </div>

        {previewUrl && (
          <a href={previewUrl} target="_blank" rel="noopener noreferrer" download={doc.filename}>
            <Button variant="ghost" size="icon" className="size-7" title="Download">
              <Download className="size-3.5" />
            </Button>
          </a>
        )}

        <Button variant="ghost" size="icon" className="size-7" onClick={onClose} title="Close preview">
          <X className="size-3.5" />
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden">
        {loadingUrl ? (
          <div className="flex items-center justify-center h-full gap-2 text-muted-foreground text-sm">
            <Loader2 className="size-4 animate-spin" /> Loading preview…
          </div>
        ) : (
          <PreviewContent url={previewUrl} filename={doc.filename} zoom={zoom} />
        )}
      </div>
    </div>
  );
}

export function DocumentsPage() {
  const { t } = useLocale();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Redirect to user-scoped URL if we're on the legacy /documents path
  useEffect(() => {
    if (user?.id && !userId) {
      navigate(`/${user.id}/documents`, { replace: true });
    }
  }, [user, userId, navigate]);

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

  // Poll while any document is still processing
  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === "processing");
    if (!hasProcessing) return;
    const interval = setInterval(() => { loadDocuments(); }, 2000);
    return () => clearInterval(interval);
  }, [documents, loadDocuments]);

  const handleUploaded = useCallback(() => {
    setShowUpload(false);
    loadDocuments();
  }, [loadDocuments]);

  const handleDelete = useCallback(async (e, doc) => {
    e.stopPropagation(); // don't navigate to detail page
    if (!window.confirm(`Delete "${doc.filename}"? This cannot be undone.`)) return;
    setDeletingId(doc.document_id);
    try {
      await documentService.deleteDocument(doc.document_id);
      setDocuments((prev) => prev.filter((d) => d.document_id !== doc.document_id));
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  }, []);

  const handlePreview = useCallback((e, doc) => {
    e.stopPropagation();
    setPreviewDoc(doc);
    // Push user-scoped URL to browser address bar
    const uid = userId || user?.id;
    if (uid) {
      window.history.pushState({}, "", `/${uid}/documents/${doc.document_id}`);
    }
  }, [userId, user]);

  const handleClosePreview = useCallback(() => {
    setPreviewDoc(null);
    // Restore the documents list URL
    const uid = userId || user?.id;
    if (uid) {
      window.history.pushState({}, "", `/${uid}/documents`);
    }
  }, [userId, user]);

  return (
    <>
      {previewDoc && (
        <PreviewModal doc={previewDoc} onClose={handleClosePreview} />
      )}

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

        {showUpload && <UploadPanel onUploaded={handleUploaded} />}

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
              const isDeleting = deletingId === doc.document_id;

              return (
                <div
                  key={doc.document_id}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors hover:bg-muted/40",
                    i > 0 && "border-t border-border",
                    isDeleting && "opacity-50 pointer-events-none"
                  )}
                  onClick={() => navigate(`/${userId || user?.id}/documents/${doc.document_id}`)}
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

                  {/* Action buttons — visible on hover */}
                  <div
                    className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-foreground"
                      title="Preview document"
                      onClick={(e) => handlePreview(e, doc)}
                    >
                      <Eye className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      title="Delete document"
                      onClick={(e) => handleDelete(e, doc)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

