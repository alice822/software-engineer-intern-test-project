"use client";

import { cn } from "@/lib/utils";
import type { EnhancementType } from "@/types/document";
import { ImageIcon, Sun, Contrast, Binary } from "lucide-react";

interface EnhancementControlsProps {
  value: EnhancementType;
  onChange: (value: EnhancementType) => void;
  disabled?: boolean;
}

const enhancements: { value: EnhancementType; label: string; icon: typeof ImageIcon }[] = [
  { value: "original", label: "Original", icon: ImageIcon },
  { value: "enhanced", label: "Enhanced", icon: Sun },
  { value: "grayscale", label: "Grayscale", icon: Contrast },
  { value: "bw", label: "Black & White", icon: Binary },
];

export function EnhancementControls({ value, onChange, disabled }: EnhancementControlsProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Enhancement</label>
      <div className="grid grid-cols-4 gap-2">
        {enhancements.map((enhancement) => {
          const Icon = enhancement.icon;
          return (
            <button
              key={enhancement.value}
              onClick={() => onChange(enhancement.value)}
              disabled={disabled}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-lg border transition-all",
                "hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed",
                value === enhancement.value
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{enhancement.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
