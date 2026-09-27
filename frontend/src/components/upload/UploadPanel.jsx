import { useState, useRef, useCallback } from "react";
import { Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils.js";
import { Button } from "@/components/ui/button.js";
import { Progress } from "@/components/ui/progress.js";
import { uploadService } from "../../services/documentService.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useLocale } from "../../context/LocaleContext.jsx";

const ACCEPTED_TYPES = [".pdf", ".docx", ".xlsx", ".pptx", ".png", ".jpg", ".jpeg"];
const MAX_SIZE = 20 * 1024 * 1024;

export function UploadPanel({ onUploaded, compact = false }) {
  const { user } = useAuth();
  const { t } = useLocale();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState(null);
  const inputRef = useRef(null);

  const handleFiles = useCallback(async (files) => {
    const file = files?.[0];
    if (!file) return;

    setError(null);
    setFileName(file.name);

    if (file.size > MAX_SIZE) {
      setError("File too large. Maximum size is 20MB.");
      return;
    }

    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!ACCEPTED_TYPES.includes(ext)) {
      setError(`Unsupported file type. Allowed: ${ACCEPTED_TYPES.join(", ")}`);
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      await uploadService.uploadDocument(file, (p) => setProgress(p));
      onUploaded?.();
    } catch (err) {
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setProgress(0);
      setFileName(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [user, onUploaded]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  if (compact) {
    return (
      <>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button onClick={() => inputRef.current?.click()} disabled={uploading} size="sm">
          {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
          {uploading ? "Uploading..." : t.uploadDocument}
        </Button>
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </>
    );
  }

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative flex flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed p-6 text-center cursor-pointer transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30",
          uploading && "pointer-events-none opacity-70"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {uploading ? (
          <>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Loader2 className="size-4 animate-spin text-primary" />
              {t.processing}
            </div>
            <div className="w-full max-w-xs">
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground mt-1">{progress}%</p>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center size-9 rounded bg-primary/10">
              <Upload className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Drop your campus document here</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                or click to browse — PDF, DOCX, XLSX, PPTX, PNG, JPG
              </p>
            </div>
          </>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive mt-2">{error}</p>
      )}
    </div>
  );
}
