"use client";

import React from "react"

import { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface CornerEditorProps {
  imageSrc: string;
  corners: { x: number; y: number }[];
  onCornersChange: (corners: { x: number; y: number }[]) => void;
  className?: string;
}

export function CornerEditor({
  imageSrc,
  corners,
  onCornersChange,
  className,
}: CornerEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  useEffect(() => {
    if (!containerRef.current || !imageSize.width) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const scale = Math.min(
      containerWidth / imageSize.width,
      containerHeight / imageSize.height
    );

    setDisplaySize({
      width: imageSize.width * scale,
      height: imageSize.height * scale,
    });
  }, [imageSize]);

  const getScaledCorners = useCallback(() => {
    if (!imageSize.width || !displaySize.width) return corners;

    const scale = displaySize.width / imageSize.width;
    return corners.map((c) => ({
      x: c.x * scale,
      y: c.y * scale,
    }));
  }, [corners, imageSize, displaySize]);

  const handlePointerDown = (index: number) => (e: React.PointerEvent) => {
    e.preventDefault();
    setDraggingIndex(index);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingIndex === null || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const offsetX = (rect.width - displaySize.width) / 2;
    const offsetY = (rect.height - displaySize.height) / 2;

    const x = Math.max(0, Math.min(displaySize.width, e.clientX - rect.left - offsetX));
    const y = Math.max(0, Math.min(displaySize.height, e.clientY - rect.top - offsetY));

    const scale = imageSize.width / displaySize.width;
    const newCorners = [...corners];
    newCorners[draggingIndex] = {
      x: Math.round(x * scale),
      y: Math.round(y * scale),
    };
    onCornersChange(newCorners);
  };

  const handlePointerUp = () => {
    setDraggingIndex(null);
  };

  const scaledCorners = getScaledCorners();
  const pathData =
    scaledCorners.length === 4
      ? `M ${scaledCorners[0].x} ${scaledCorners[0].y} 
         L ${scaledCorners[1].x} ${scaledCorners[1].y} 
         L ${scaledCorners[2].x} ${scaledCorners[2].y} 
         L ${scaledCorners[3].x} ${scaledCorners[3].y} Z`
      : "";

  return (
    <div
      ref={containerRef}
      className={cn("relative bg-muted rounded-lg overflow-hidden", className)}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: displaySize.width, height: displaySize.height }}
      >
        <img
          src={imageSrc || "/placeholder.svg"}
          alt="Document"
          className="w-full h-full object-contain"
          draggable={false}
        />

        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ width: displaySize.width, height: displaySize.height }}
        >
          <defs>
            <mask id="overlay-mask">
              <rect width="100%" height="100%" fill="white" />
              <path d={pathData} fill="black" />
            </mask>
          </defs>

          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.4)"
            mask="url(#overlay-mask)"
          />

          <path
            d={pathData}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {scaledCorners.map((corner, i) => {
            const nextCorner = scaledCorners[(i + 1) % 4];
            const midX = (corner.x + nextCorner.x) / 2;
            const midY = (corner.y + nextCorner.y) / 2;
            return (
              <circle
                key={`mid-${i}`}
                cx={midX}
                cy={midY}
                r="4"
                fill="hsl(var(--primary))"
                opacity="0.5"
              />
            );
          })}
        </svg>

        {scaledCorners.map((corner, index) => (
          <div
            key={index}
            className={cn(
              "absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing",
              "rounded-full border-2 border-primary bg-background shadow-lg",
              "flex items-center justify-center text-[10px] font-medium text-primary",
              "transition-transform hover:scale-110",
              draggingIndex === index && "scale-125"
            )}
            style={{ left: corner.x, top: corner.y }}
            onPointerDown={handlePointerDown(index)}
          >
            {index + 1}
          </div>
        ))}
      </div>
    </div>
  );
}
