"use client";

import { useEffect, useState, useCallback } from "react";

declare global {
  interface Window {
    cv: any;
    Module: {
      onRuntimeInitialized: () => void;
    };
  }
}

export interface DetectedDocument {
  corners: { x: number; y: number }[];
  confidence: number;
}

export function useOpenCV() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.cv && window.cv.Mat) {
      setIsLoaded(true);
      return;
    }

    if (isLoading) return;

    setIsLoading(true);

    const loadScript = (url: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = url;
        script.async = true;

        script.onload = () => {
          const checkReady = setInterval(() => {
            if (window.cv && window.cv.Mat) {
              clearInterval(checkReady);
              resolve();
            }
          }, 100);

          setTimeout(() => {
            clearInterval(checkReady);
            if (!window.cv || !window.cv.Mat) {
              reject(new Error("OpenCV failed to initialize"));
            }
          }, 15000);
        };

        script.onerror = () => reject(new Error("Failed to load script"));
        document.head.appendChild(script);
      });
    };

    const urls = [
      "https://docs.opencv.org/4.x/opencv.js",
      "https://cdn.jsdelivr.net/npm/opencv.js@1.2.1/opencv.js",
    ];

    const tryLoadOpenCV = async () => {
      for (const url of urls) {
        try {
          await loadScript(url);
          setIsLoaded(true);
          setIsLoading(false);
          return;
        } catch {
          console.warn(`Failed to load OpenCV from ${url}, trying next...`);
        }
      }
      // All sources failed - set loaded anyway so the UI works
      // Document detection just won't be available
      console.warn("OpenCV could not be loaded. Document detection will use fallback.");
      setIsLoading(false);
      setError("OpenCV unavailable - using manual mode");
    };

    tryLoadOpenCV();
  }, [isLoading]);

  const detectDocument = useCallback(
    (imageElement: HTMLImageElement): DetectedDocument | null => {
      if (!isLoaded || !window.cv) return null;

      const cv = window.cv;

      try {
        const src = cv.imread(imageElement);
        const gray = new cv.Mat();
        const blurred = new cv.Mat();
        const edges = new cv.Mat();

        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
        cv.Canny(blurred, edges, 75, 200);

        const kernel = cv.Mat.ones(5, 5, cv.CV_8U);
        cv.dilate(edges, edges, kernel);

        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();
        cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        let bestContour: { corners: { x: number; y: number }[]; area: number } | null = null;
        const imgArea = src.rows * src.cols;

        for (let i = 0; i < contours.size(); i++) {
          const contour = contours.get(i);
          const area = cv.contourArea(contour);

          if (area < imgArea * 0.1) continue;

          const peri = cv.arcLength(contour, true);
          const approx = new cv.Mat();
          cv.approxPolyDP(contour, approx, 0.02 * peri, true);

          if (approx.rows === 4) {
            const corners: { x: number; y: number }[] = [];
            for (let j = 0; j < 4; j++) {
              corners.push({
                x: approx.data32S[j * 2],
                y: approx.data32S[j * 2 + 1],
              });
            }

            if (!bestContour || area > bestContour.area) {
              bestContour = { corners, area };
            }
          }

          approx.delete();
        }

        src.delete();
        gray.delete();
        blurred.delete();
        edges.delete();
        kernel.delete();
        contours.delete();
        hierarchy.delete();

        if (bestContour) {
          return {
            corners: orderCorners(bestContour.corners),
            confidence: Math.min((bestContour.area / imgArea) * 2, 1),
          };
        }

        return null;
      } catch (e) {
        console.error("Document detection error:", e);
        return null;
      }
    },
    [isLoaded]
  );

  const applyPerspectiveCorrection = useCallback(
    (
      imageElement: HTMLImageElement,
      corners: { x: number; y: number }[]
    ): string | null => {
      if (!isLoaded || !window.cv) return null;

      const cv = window.cv;

      try {
        const src = cv.imread(imageElement);

        const width = Math.max(
          distance(corners[0], corners[1]),
          distance(corners[2], corners[3])
        );
        const height = Math.max(
          distance(corners[0], corners[3]),
          distance(corners[1], corners[2])
        );

        const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
          corners[0].x, corners[0].y,
          corners[1].x, corners[1].y,
          corners[2].x, corners[2].y,
          corners[3].x, corners[3].y,
        ]);

        const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
          0, 0,
          width, 0,
          width, height,
          0, height,
        ]);

        const M = cv.getPerspectiveTransform(srcPoints, dstPoints);
        const dst = new cv.Mat();
        cv.warpPerspective(src, dst, M, new cv.Size(width, height));

        const canvas = document.createElement("canvas");
        cv.imshow(canvas, dst);
        const dataUrl = canvas.toDataURL("image/png");

        src.delete();
        dst.delete();
        srcPoints.delete();
        dstPoints.delete();
        M.delete();

        return dataUrl;
      } catch (e) {
        console.error("Perspective correction error:", e);
        return null;
      }
    },
    [isLoaded]
  );

  const applyEnhancement = useCallback(
    (
      imageElement: HTMLImageElement,
      type: "original" | "enhanced" | "grayscale" | "bw"
    ): string | null => {
      if (!isLoaded || !window.cv) return null;

      const cv = window.cv;

      try {
        const src = cv.imread(imageElement);
        const dst = new cv.Mat();

        switch (type) {
          case "original":
            src.copyTo(dst);
            break;
          case "enhanced":
            cv.cvtColor(src, dst, cv.COLOR_RGBA2RGB);
            const lab = new cv.Mat();
            cv.cvtColor(dst, lab, cv.COLOR_RGB2Lab);
            const labChannels = new cv.MatVector();
            cv.split(lab, labChannels);
            const clahe = new cv.CLAHE(2.0, new cv.Size(8, 8));
            clahe.apply(labChannels.get(0), labChannels.get(0));
            cv.merge(labChannels, lab);
            cv.cvtColor(lab, dst, cv.COLOR_Lab2RGB);
            lab.delete();
            labChannels.delete();
            break;
          case "grayscale":
            cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
            break;
          case "bw":
            const gray = new cv.Mat();
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
            cv.adaptiveThreshold(
              gray,
              dst,
              255,
              cv.ADAPTIVE_THRESH_GAUSSIAN_C,
              cv.THRESH_BINARY,
              11,
              2
            );
            gray.delete();
            break;
        }

        const canvas = document.createElement("canvas");
        cv.imshow(canvas, dst);
        const dataUrl = canvas.toDataURL("image/png");

        src.delete();
        dst.delete();

        return dataUrl;
      } catch (e) {
        console.error("Enhancement error:", e);
        return null;
      }
    },
    [isLoaded]
  );

  return {
    isLoaded,
    isLoading,
    error,
    detectDocument,
    applyPerspectiveCorrection,
    applyEnhancement,
  };
}

function orderCorners(corners: { x: number; y: number }[]): { x: number; y: number }[] {
  const sorted = [...corners].sort((a, b) => a.y - b.y);
  const top = sorted.slice(0, 2).sort((a, b) => a.x - b.x);
  const bottom = sorted.slice(2, 4).sort((a, b) => a.x - b.x);
  return [top[0], top[1], bottom[1], bottom[0]];
}

function distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}
