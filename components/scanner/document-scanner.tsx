"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { UploadDropzone } from "./upload-dropzone";
import { ProcessingQueue } from "./processing-queue";
import { CornerEditor } from "./corner-editor";
import { ComparisonView } from "./comparison-view";
import { EnhancementControls } from "./enhancement-controls";
import { useOpenCV } from "@/hooks/use-opencv";
import type { QueueItem, EnhancementType } from "@/types/document";
import { Download, Save, RotateCcw, Loader2, ChevronLeft, ChevronRight, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { storage, db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";

interface DocumentScannerProps {
  onScanComplete?: () => void;
}

export function DocumentScanner({ onScanComplete }: DocumentScannerProps) {
  const { user } = useAuth();
  const { isLoaded, isLoading, detectDocument, applyPerspectiveCorrection, applyEnhancement } = useOpenCV();
  
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<"corners" | "compare">("corners");
  const [enhancement, setEnhancement] = useState<EnhancementType>("enhanced");
  const [isSaving, setIsSaving] = useState(false);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  
  const processingRef = useRef(false);

  const selectedItem = queue.find((item) => item.id === selectedId);

  const processImage = useCallback(
    async (item: QueueItem): Promise<Partial<QueueItem>> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const detected = detectDocument(img);
          
          if (detected && detected.corners.length === 4) {
            const processed = applyPerspectiveCorrection(img, detected.corners);
            resolve({
              detectedCorners: detected.corners,
              processedImage: processed || item.preview,
              status: "completed",
              progress: 100,
            });
          } else {
            const width = img.naturalWidth;
            const height = img.naturalHeight;
            const defaultCorners = [
              { x: Math.round(width * 0.1), y: Math.round(height * 0.1) },
              { x: Math.round(width * 0.9), y: Math.round(height * 0.1) },
              { x: Math.round(width * 0.9), y: Math.round(height * 0.9) },
              { x: Math.round(width * 0.1), y: Math.round(height * 0.9) },
            ];
            resolve({
              detectedCorners: defaultCorners,
              processedImage: item.preview,
              status: "completed",
              progress: 100,
            });
          }
        };
        img.onerror = () => {
          resolve({
            status: "error",
            error: "Failed to load image",
          });
        };
        img.src = item.preview;
      });
    },
    [detectDocument, applyPerspectiveCorrection]
  );

  useEffect(() => {
    // Process even if OpenCV isn't loaded - we'll use fallback corners
    if (processingRef.current) return;

    const pendingItem = queue.find((item) => item.status === "pending");
    if (!pendingItem) return;

    processingRef.current = true;

    setQueue((prev) =>
      prev.map((item) =>
        item.id === pendingItem.id
          ? { ...item, status: "processing", progress: 10 }
          : item
      )
    );

    const progressInterval = setInterval(() => {
      setQueue((prev) =>
        prev.map((item) =>
          item.id === pendingItem.id && item.status === "processing"
            ? { ...item, progress: Math.min(item.progress + 10, 90) }
            : item
        )
      );
    }, 200);

    processImage(pendingItem).then((result) => {
      clearInterval(progressInterval);
      setQueue((prev) =>
        prev.map((item) =>
          item.id === pendingItem.id ? { ...item, ...result } : item
        )
      );
      processingRef.current = false;

      if (result.status === "completed" && !selectedId) {
        setSelectedId(pendingItem.id);
      }
    });

    return () => clearInterval(progressInterval);
  }, [queue, processImage, selectedId]);

  const handleFilesSelected = useCallback((files: File[]) => {
    const newItems: QueueItem[] = files.map((file) => ({
      id: Math.random().toString(36).slice(2),
      file,
      preview: URL.createObjectURL(file),
      status: "pending",
      progress: 0,
    }));

    setQueue((prev) => [...prev, ...newItems]);
  }, []);

  const handleRemove = useCallback((id: string) => {
    setQueue((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((i) => i.id !== id);
    });
    if (selectedId === id) {
      setSelectedId(null);
    }
  }, [selectedId]);

  const handleRetry = useCallback((id: string) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "pending", progress: 0, error: undefined } : item
      )
    );
  }, []);

  const handleCornersChange = useCallback(
    (corners: { x: number; y: number }[]) => {
      if (!selectedItem) return;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const processed = applyPerspectiveCorrection(img, corners);
        setQueue((prev) =>
          prev.map((item) =>
            item.id === selectedId
              ? { ...item, detectedCorners: corners, processedImage: processed || item.preview }
              : item
          )
        );
      };
      img.src = selectedItem.preview;
    },
    [selectedItem, selectedId, applyPerspectiveCorrection]
  );

  const handleAutoDetect = useCallback(() => {
    if (!selectedItem) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const detected = detectDocument(img);
      if (detected && detected.corners.length === 4) {
        handleCornersChange(detected.corners);
      }
    };
    img.src = selectedItem.preview;
  }, [selectedItem, detectDocument, handleCornersChange]);

  useEffect(() => {
    if (!selectedItem?.processedImage) {
      setEnhancedImage(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (isLoaded) {
        const enhanced = applyEnhancement(img, enhancement);
        setEnhancedImage(enhanced || selectedItem.processedImage);
      } else {
        // Fallback: use the processed image directly
        setEnhancedImage(selectedItem.processedImage);
      }
    };
    img.src = selectedItem.processedImage;
  }, [selectedItem?.processedImage, enhancement, isLoaded, applyEnhancement]);

  const handleSave = useCallback(async () => {
    if (!selectedItem || !user || !enhancedImage || !storage || !db) return;

    setIsSaving(true);
    try {
      const response = await fetch(enhancedImage);
      const blob = await response.blob();

      const timestamp = Date.now();
      const originalRef = ref(storage, `users/${user.uid}/documents/${timestamp}_original.png`);
      const processedRef = ref(storage, `users/${user.uid}/documents/${timestamp}_processed.png`);

      const originalBlob = await fetch(selectedItem.preview).then((r) => r.blob());
      await uploadBytes(originalRef, originalBlob);
      await uploadBytes(processedRef, blob);

      const originalUrl = await getDownloadURL(originalRef);
      const processedUrl = await getDownloadURL(processedRef);

      await addDoc(collection(db, "documents"), {
        userId: user.uid,
        originalUrl,
        processedUrl,
        thumbnailUrl: processedUrl,
        corners: selectedItem.detectedCorners,
        enhancement,
        fileName: selectedItem.file.name,
        fileSize: selectedItem.file.size,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      handleRemove(selectedItem.id);
      onScanComplete?.();
    } catch (error) {
      console.error("Failed to save document:", error);
    } finally {
      setIsSaving(false);
    }
  }, [selectedItem, user, enhancedImage, enhancement, handleRemove, onScanComplete]);

  const handleDownload = useCallback(() => {
    if (!enhancedImage || !selectedItem) return;

    const link = document.createElement("a");
    link.href = enhancedImage;
    link.download = `scanned_${selectedItem.file.name}`;
    link.click();
  }, [enhancedImage, selectedItem]);

  const navigateItem = useCallback(
    (direction: "prev" | "next") => {
      const completedItems = queue.filter((i) => i.status === "completed");
      const currentIndex = completedItems.findIndex((i) => i.id === selectedId);
      
      if (direction === "prev" && currentIndex > 0) {
        setSelectedId(completedItems[currentIndex - 1].id);
      } else if (direction === "next" && currentIndex < completedItems.length - 1) {
        setSelectedId(completedItems[currentIndex + 1].id);
      }
    },
    [queue, selectedId]
  );

  const completedItems = queue.filter((i) => i.status === "completed");
  const currentIndex = completedItems.findIndex((i) => i.id === selectedId);

  return (
    <div className="grid lg:grid-cols-[1fr,400px] gap-6 h-full">
      <div className="flex flex-col gap-6">
        {!selectedItem ? (
          <div className="flex-1 flex flex-col justify-center">
            <UploadDropzone
              onFilesSelected={handleFilesSelected}
              disabled={false}
            />
            {isLoading && (
              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading document scanner engine...
              </div>
            )}
            {!isLoaded && !isLoading && (
              <p className="text-sm text-muted-foreground text-center mt-4">
                Document scanner ready. Upload an image to get started.
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateItem("prev")}
                  disabled={currentIndex <= 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentIndex + 1} of {completedItems.length}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateItem("next")}
                  disabled={currentIndex >= completedItems.length - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={editMode === "corners" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEditMode("corners")}
                >
                  Adjust Corners
                </Button>
                <Button
                  variant={editMode === "compare" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEditMode("compare")}
                >
                  Compare
                </Button>
              </div>
            </div>

            {editMode === "corners" ? (
              <div className="flex-1 min-h-0">
                <CornerEditor
                  imageSrc={selectedItem.preview}
                  corners={selectedItem.detectedCorners || []}
                  onCornersChange={handleCornersChange}
                  className="h-full min-h-[400px]"
                />
              </div>
            ) : (
              <div className="flex-1 min-h-0">
                <ComparisonView
                  originalSrc={selectedItem.preview}
                  processedSrc={enhancedImage || selectedItem.processedImage || selectedItem.preview}
                  className="h-full"
                />
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex flex-col gap-6">
        <div className="p-4 bg-card rounded-xl border border-border">
          <ProcessingQueue
            items={queue}
            onRemove={handleRemove}
            onRetry={handleRetry}
            onSelect={setSelectedId}
            selectedId={selectedId || undefined}
          />

          {queue.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No documents in queue. Upload images to get started.
            </p>
          )}
        </div>

        {selectedItem && (
          <>
            <div className="p-4 bg-card rounded-xl border border-border space-y-4">
              <EnhancementControls
                value={enhancement}
                onChange={setEnhancement}
                disabled={!enhancedImage}
              />

              <div className="pt-2 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAutoDetect}
                  className="w-full bg-transparent"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Auto-Detect Corners
                </Button>
              </div>
            </div>

            <div className="p-4 bg-card rounded-xl border border-border">
              <div className="aspect-video rounded-lg overflow-hidden bg-muted mb-4">
                {enhancedImage ? (
                  <img
                    src={enhancedImage || "/placeholder.svg"}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={handleDownload}
                  disabled={!enhancedImage}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSave}
                  disabled={isSaving || !enhancedImage}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save
                </Button>
              </div>
            </div>
          </>
        )}

        {!selectedItem && queue.length > 0 && (
          <div className="p-4 bg-card rounded-xl border border-border">
            <p className="text-sm text-muted-foreground text-center">
              Select a completed document from the queue to edit
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
