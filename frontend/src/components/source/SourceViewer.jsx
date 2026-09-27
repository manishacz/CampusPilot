import { useState } from "react";
import { FileText, X, ZoomIn, ZoomOut, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button.js";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog.js";
import { Separator } from "@/components/ui/separator.js";
import { ConfidenceIndicator, CONFIDENCE_CONFIG } from "./ConfidenceIndicator.jsx";
import { cn } from "@/lib/utils.js";

export function SourceViewer({ task, open, onOpenChange }) {
  const [zoom, setZoom] = useState(1);

  if (!task) return null;

  const source = task.source_ref || {
    page: task.source_page || 1,
    bbox: task.source_bbox,
  };
  const lowConfidence = task.confidence === "low";
  const mediumConfidence = task.confidence === "medium";
  const isNormalized = source?.bbox && source.bbox[0] <= 1 && source.bbox[1] <= 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogTitle className="sr-only">Source Document</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="size-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{task.title}</p>
              <p className="text-xs text-muted-foreground">
                Source: Page {source?.page || 1}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
              aria-label="Zoom out"
            >
              <ZoomOut className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setZoom((z) => Math.min(2, z + 0.2))}
              aria-label="Zoom in"
            >
              <ZoomIn className="size-4" />
            </Button>
          </div>
        </div>

        {/* Document preview */}
        <div className="overflow-auto bg-muted/30 p-4 max-h-[60vh]">
          <div
            className="relative mx-auto bg-white shadow-md rounded-sm border border-border"
            style={{
              width: `${440 * zoom}px`,
              height: `${580 * zoom}px`,
            }}
          >
            {/* Simulated document content */}
            <div
              className="absolute inset-0 p-8 text-sm leading-relaxed text-neutral-800"
              style={{ fontSize: `${10 * zoom}px` }}
            >
              <div className="text-center font-bold text-base mb-3">
                {task.category === "placement" && "PLACEMENT CELL NOTIFICATION"}
                {task.category === "scholarship" && "SCHOLARSHIP NOTICE"}
                {task.category === "exam" && "EXAMINATION SECTION"}
                {task.category === "hostel" && "HOSTEL OFFICE CIRCULAR"}
                {task.category === "event" && "EVENT REGISTRATION NOTICE"}
              </div>
              <div className="text-center text-xs mb-4 text-neutral-600">
                Ref: CP/{new Date().getFullYear()}/{source?.page || 1}
              </div>
              <div className="space-y-2">
                <p>This is to inform all eligible students that the following opportunity is available:</p>
                <p className="font-semibold">{task.title}</p>
                {task.eligibility && (
                  <p>
                    Eligibility: {Array.isArray(task.eligibility)
                      ? task.eligibility.join(", ")
                      : [
                          task.eligibility.branches?.join(", "),
                          task.eligibility.graduation_year && `Batch ${task.eligibility.graduation_year}`,
                          task.eligibility.min_cgpa && `CGPA ≥ ${task.eligibility.min_cgpa}`,
                        ].filter(Boolean).join(", ")}
                  </p>
                )}
                {task.requirements?.map((req, i) => (
                  <p key={i} className="pl-4">• {req}</p>
                ))}
                <p>Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString("en-US", { dateStyle: "long" }) : "Not specified / Rolling"}</p>
                <p className="mt-4 text-xs text-neutral-500">— Office of Student Affairs</p>
              </div>
            </div>

            {/* Bounding box highlight */}
            {source?.bbox && (
              <div
                className="absolute border-2 border-primary bg-primary/15 rounded-sm pointer-events-none transition-all"
                style={{
                  left: `${(isNormalized ? source.bbox[0] * 440 : source.bbox[0] * (440 / 700)) * zoom}px`,
                  top: `${(isNormalized ? source.bbox[1] * 580 : source.bbox[1] * (580 / 900)) * zoom}px`,
                  width: `${(isNormalized ? source.bbox[2] * 440 : source.bbox[2] * (440 / 700)) * zoom}px`,
                  height: `${(isNormalized ? source.bbox[3] * 580 : source.bbox[3] * (580 / 900)) * zoom}px`,
                }}
              />
            )}
          </div>
        </div>

        <Separator />

        {/* Footer with confidence */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <ConfidenceIndicator confidence={task.confidence} size="md" />
            <span className="text-xs text-muted-foreground">
              Extraction confidence: {task.confidence === "high" ? "High" : task.confidence === "medium" ? "Medium" : "Low"}
            </span>
          </div>
          {(lowConfidence || mediumConfidence) && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-warning-foreground">
              <AlertTriangle className="size-3.5 shrink-0" />
              {CONFIDENCE_CONFIG[task.confidence].warning}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
