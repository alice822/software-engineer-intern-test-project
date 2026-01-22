"use client";

import React from "react"

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { ArrowLeftRight } from "lucide-react";

interface ComparisonViewProps {
  originalSrc: string;
  processedSrc: string;
  className?: string;
}

export function ComparisonView({ originalSrc, processedSrc, className }: ComparisonViewProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    handleMove(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        ref={containerRef}
        className="relative aspect-[4/3] rounded-lg overflow-hidden cursor-ew-resize select-none bg-muted"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <img
          src={processedSrc || "/placeholder.svg"}
          alt="Processed"
          className="absolute inset-0 w-full h-full object-contain"
          draggable={false}
        />

        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={originalSrc || "/placeholder.svg"}
            alt="Original"
            className="absolute inset-0 w-full h-full object-contain"
            style={{ width: `${100 / (sliderPosition / 100)}%`, maxWidth: "none" }}
            draggable={false}
          />
        </div>

        <div
          className="absolute top-0 bottom-0 w-1 bg-background shadow-lg"
          style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background shadow-lg border border-border flex items-center justify-center">
            <ArrowLeftRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>

        <div className="absolute top-3 left-3 px-2 py-1 bg-background/80 backdrop-blur-sm rounded text-xs font-medium">
          Original
        </div>
        <div className="absolute top-3 right-3 px-2 py-1 bg-background/80 backdrop-blur-sm rounded text-xs font-medium">
          Scanned
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-xs text-muted-foreground w-16">Original</span>
        <Slider
          value={[sliderPosition]}
          onValueChange={([value]) => setSliderPosition(value)}
          max={100}
          step={1}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground w-16 text-right">Scanned</span>
      </div>
    </div>
  );
}
