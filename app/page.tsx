"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { AuthForm } from "@/components/auth/auth-form";
import { Header } from "@/components/layout/header";
import { DocumentScanner } from "@/components/scanner/document-scanner";
import { DocumentGallery } from "@/components/scanner/document-gallery";
import { Loader2, ScanLine, AlertTriangle } from "lucide-react";

export default function Home() {
  const { user, loading, isConfigured } = useAuth();
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [activeTab, setActiveTab] = useState<"scan" | "gallery">("scan");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">Firebase Configuration Required</h1>
          <p className="text-muted-foreground mb-6">
            Please add your Firebase configuration environment variables in the sidebar (Vars section) to use DocScanner.
          </p>
          <div className="text-left bg-muted/50 rounded-lg p-4 text-sm font-mono">
            <p className="text-muted-foreground mb-2">Required variables:</p>
            <ul className="space-y-1 text-foreground">
              <li>NEXT_PUBLIC_FIREBASE_API_KEY</li>
              <li>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</li>
              <li>NEXT_PUBLIC_FIREBASE_PROJECT_ID</li>
              <li>NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET</li>
              <li>NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID</li>
              <li>NEXT_PUBLIC_FIREBASE_APP_ID</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex bg-background">
        <div className="flex-1 flex items-center justify-center p-8">
          <AuthForm
            mode={authMode}
            onToggleMode={() => setAuthMode(authMode === "login" ? "register" : "login")}
          />
        </div>

        <div className="hidden lg:flex flex-1 bg-primary/5 items-center justify-center p-12">
          <div className="max-w-md text-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <ScanLine className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4 text-balance">
              Transform your documents with intelligent scanning
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              DocScanner uses advanced edge detection to automatically identify and crop your documents. 
              Get perfectly aligned, enhanced scans every time.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">Auto</div>
                <div className="text-xs text-muted-foreground mt-1">Edge Detection</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">4</div>
                <div className="text-xs text-muted-foreground mt-1">Enhancement Modes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">Cloud</div>
                <div className="text-xs text-muted-foreground mt-1">Storage</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "scan" ? (
          <DocumentScanner onScanComplete={() => setActiveTab("gallery")} />
        ) : (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Document Gallery</h1>
              <p className="text-sm text-muted-foreground mt-1">
                View and manage your scanned documents
              </p>
            </div>
            <DocumentGallery />
          </div>
        )}
      </main>
    </div>
  );
}
