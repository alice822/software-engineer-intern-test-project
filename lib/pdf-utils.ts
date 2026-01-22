"use client";

export interface PDFPage {
  pageNumber: number;
  imageDataUrl: string;
  width: number;
  height: number;
}

export async function convertPDFToImages(
  file: File,
  scale: number = 2.0
): Promise<PDFPage[]> {

  const pdfjsLib = await import("pdfjs-dist");

  // ✅ Correct worker setup for Next.js + ESM
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const pages: PDFPage[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Could not get canvas context");
    }

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    // ✅ FIX: canvas is REQUIRED
    await page.render({
      canvasContext: context,
      viewport,
      canvas,
    }).promise;

    const imageDataUrl = canvas.toDataURL("image/png");

    pages.push({
      pageNumber: i,
      imageDataUrl,
      width: viewport.width,
      height: viewport.height,
    });

    // ✅ Prevent memory leaks
    page.cleanup();
  }

  return pages;
}

export function isPDF(file: File): boolean {
  return (
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  );
}
