"use client";

import React from "react"

import { useCallback, useState } from "react";
import { Upload, Image as ImageIcon, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { isPDF, convertPDFToImages } from "@/lib/pdf-utils";

interface UploadDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

const isValidFile = (file: File) => {
  return file.type.startsWith("image/") || isPDF(file);
};

export function UploadDropzone({ onFilesSelected, disabled }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingPDF, setIsProcessingPDF] = useState(false);

  const processPDFFiles = useCallback(async (files: File[]): Promise<File[]> => {
    const processedFiles: File[] = [];

    for (const file of files) {
      if (isPDF(file)) {
        try {
          const pages = await convertPDFToImages(file);
          for (const page of pages) {
            // Convert data URL to File
            const response = await fetch(page.imageDataUrl);
            const blob = await response.blob();
            const fileName = `${file.name.replace(".pdf", "")}_page_${page.pageNumber}.png`;
            const imageFile = new File([blob], fileName, { type: "image/png" });
            processedFiles.push(imageFile);
          }
        } catch (error) {
          console.error("Failed to process PDF:", error);
        }
      } else {
        processedFiles.push(file);
      }
    }

    return processedFiles;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const validFiles = Array.from(e.dataTransfer.files).filter(isValidFile);

      if (validFiles.length > 0) {
        const hasPDF = validFiles.some(isPDF);
        if (hasPDF) {
          setIsProcessingPDF(true);
          const processedFiles = await processPDFFiles(validFiles);
          setIsProcessingPDF(false);
          onFilesSelected(processedFiles);
        } else {
          onFilesSelected(validFiles);
        }
      }
    },
    [onFilesSelected, disabled, processPDFFiles]
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const validFiles = Array.from(e.target.files || []).filter(isValidFile);

      if (validFiles.length > 0) {
        const hasPDF = validFiles.some(isPDF);
        if (hasPDF) {
          setIsProcessingPDF(true);
          const processedFiles = await processPDFFiles(validFiles);
          setIsProcessingPDF(false);
          onFilesSelected(processedFiles);
        } else {
          onFilesSelected(validFiles);
        }
      }

      e.target.value = "";
    },
    [onFilesSelected, processPDFFiles]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative border-2 border-dashed rounded-xl p-12 transition-all duration-200 cursor-pointer",
        isDragging
          ? "border-primary bg-primary/5 scale-[1.02]"
          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <input
        type="file"
        accept="image/*,.pdf,application/pdf"
        multiple
        onChange={handleFileInput}
        disabled={disabled || isProcessingPDF}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />

      <div className="flex flex-col items-center gap-4 text-center">
        {isProcessingPDF ? (
          <>
            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-primary text-primary-foreground">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <p className="text-lg font-medium text-foreground">
                Processing PDF...
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Converting pages to images
              </p>
            </div>
          </>
        ) : (
          <>
            <div
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
                isDragging ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {isDragging ? (
                <Upload className="w-8 h-8" />
              ) : (
                <ImageIcon className="w-8 h-8" />
              )}
            </div>

            <div>
              <p className="text-lg font-medium text-foreground">
                {isDragging ? "Drop your documents here" : "Upload documents to scan"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Drag and drop images or PDFs, or click to browse
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap justify-center">
              <span className="px-2 py-1 bg-muted rounded">JPG</span>
              <span className="px-2 py-1 bg-muted rounded">PNG</span>
              <span className="px-2 py-1 bg-muted rounded">WEBP</span>
              <span className="px-2 py-1 bg-muted rounded flex items-center gap-1">
                <FileText className="w-3 h-3" />
                PDF
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
