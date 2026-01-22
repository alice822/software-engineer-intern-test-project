"use client";

import { X, Check, Loader2, AlertCircle, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { QueueItem } from "@/types/document";
import { cn } from "@/lib/utils";

interface ProcessingQueueProps {
  items: QueueItem[];
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onSelect: (id: string) => void;
  selectedId?: string;
}

export function ProcessingQueue({
  items,
  onRemove,
  onRetry,
  onSelect,
  selectedId,
}: ProcessingQueueProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">
          Processing Queue ({items.length})
        </h3>
        <span className="text-xs text-muted-foreground">
          {items.filter((i) => i.status === "completed").length} completed
        </span>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => item.status === "completed" && onSelect(item.id)}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border transition-all",
              item.status === "completed" && "cursor-pointer hover:bg-muted/50",
              selectedId === item.id
                ? "border-primary bg-primary/5"
                : "border-border bg-card"
            )}
          >
            <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
              {item.processedImage || item.preview ? (
                <img
                  src={item.processedImage || item.preview}
                  alt={item.file.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FileImage className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.file.name}</p>
              <div className="flex items-center gap-2 mt-1">
                {item.status === "pending" && (
                  <span className="text-xs text-muted-foreground">Waiting...</span>
                )}
                {item.status === "processing" && (
                  <>
                    <Progress value={item.progress} className="h-1 flex-1" />
                    <span className="text-xs text-muted-foreground">{item.progress}%</span>
                  </>
                )}
                {item.status === "completed" && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Complete
                  </span>
                )}
                {item.status === "error" && (
                  <span className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {item.error || "Error"}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              {item.status === "processing" && (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              )}
              {item.status === "error" && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRetry(item.id);
                  }}
                >
                  <Loader2 className="w-4 h-4" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(item.id);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
