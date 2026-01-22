"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import type { ScannedDocument } from "@/types/document";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ComparisonView } from "./comparison-view";
import {
  MoreVertical,
  Download,
  Trash2,
  Eye,
  Loader2,
  FileImage,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export function DocumentGallery() {
  const { user } = useAuth();

  const [documents, setDocuments] = useState<ScannedDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDoc, setSelectedDoc] = useState<ScannedDocument | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !db) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "documents"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() ?? new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() ?? new Date(),
      })) as ScannedDocument[];

      setDocuments(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (document: ScannedDocument) => {
    if (!user || !db || !storage) return;

    setDeleting(document.id);

    try {
      const extractPath = (url: string): string | null => {
        const match = url.match(/o\/(.+?)\?/);
        return match ? decodeURIComponent(match[1]) : null;
      };

      const originalPath = extractPath(document.originalUrl);
      const processedPath = extractPath(document.processedUrl);

      if (originalPath) {
        await deleteObject(ref(storage, originalPath)).catch(() => {});
      }

      if (processedPath) {
        await deleteObject(ref(storage, processedPath)).catch(() => {});
      }

      await deleteDoc(doc(db, "documents", document.id));
    } catch (err) {
      console.error("Failed to delete document:", err);
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = (url: string, fileName: string): void => {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.target = "_blank";
    link.click();
  };

  /* -------------------- LOADING -------------------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  /* -------------------- EMPTY -------------------- */
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <FileImage className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">
          No documents yet
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Your scanned documents will appear here. Start by uploading and
          scanning your first document.
        </p>
      </div>
    );
  }

  /* -------------------- GALLERY -------------------- */
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {documents.map((document) => (
          <div
            key={document.id}
            className={cn(
              "group relative aspect-3/4 rounded-lg overflow-hidden bg-muted border border-border",
              "hover:border-primary/50 transition-all cursor-pointer"
            )}
            onClick={() => setSelectedDoc(document)}
          >
            <img
              src={document.thumbnailUrl || "/placeholder.svg"}
              alt={document.fileName}
              className="w-full h-full object-cover"
            />

            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-xs text-white/90 truncate font-medium">
                {document.fileName}
              </p>
              <p className="text-xs text-white/60">
                {formatDistanceToNow(document.createdAt, { addSuffix: true })}
              </p>
            </div>

            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                >
                  <Button size="icon" variant="secondary" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      setSelectedDoc(document);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleDownload(
                        document.processedUrl,
                        `scanned_${document.fileName}`
                      );
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    disabled={deleting === document.id}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleDelete(document);
                    }}
                  >
                    {deleting === document.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {deleting === document.id && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedDoc?.fileName}</DialogTitle>
          </DialogHeader>

          {selectedDoc && (
            <div className="space-y-4">
              <ComparisonView
                originalSrc={selectedDoc.originalUrl}
                processedSrc={selectedDoc.processedUrl}
              />

              <div className="flex justify-between items-center pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Scanned{" "}
                  {formatDistanceToNow(selectedDoc.createdAt, {
                    addSuffix: true,
                  })}
                </p>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleDownload(
                        selectedDoc.originalUrl,
                        selectedDoc.fileName
                      )
                    }
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Original
                  </Button>

                  <Button
                    onClick={() =>
                      handleDownload(
                        selectedDoc.processedUrl,
                        `scanned_${selectedDoc.fileName}`
                      )
                    }
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Scanned
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
