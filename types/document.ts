export interface DocumentCorners {
  topLeft: { x: number; y: number };
  topRight: { x: number; y: number };
  bottomRight: { x: number; y: number };
  bottomLeft: { x: number; y: number };
}

export interface ScannedDocument {
  id: string;
  userId: string;
  originalUrl: string;
  processedUrl: string;
  thumbnailUrl: string;
  corners: { x: number; y: number }[];
  enhancement: "original" | "enhanced" | "grayscale" | "bw";
  createdAt: Date;
  updatedAt: Date;
  fileName: string;
  fileSize: number;
}

export interface QueueItem {
  id: string;
  file: File;
  preview: string;
  status: "pending" | "processing" | "completed" | "error";
  progress: number;
  detectedCorners?: { x: number; y: number }[];
  processedImage?: string;
  error?: string;
}

export type EnhancementType = "original" | "enhanced" | "grayscale" | "bw";
