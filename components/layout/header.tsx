"use client";

import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScanLine, User, LogOut, Settings } from "lucide-react";

interface HeaderProps {
  activeTab: "scan" | "gallery";
  onTabChange: (tab: "scan" | "gallery") => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <ScanLine className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold text-foreground">DocScanner</span>
            </div>

            <nav className="hidden sm:flex items-center gap-1">
              <Button
                variant={activeTab === "scan" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onTabChange("scan")}
              >
                Scan
              </Button>
              <Button
                variant={activeTab === "gallery" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onTabChange("gallery")}
              >
                Gallery
              </Button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {user?.photoURL ? (
                      <img
                        src={user.photoURL || "/placeholder.svg"}
                        alt="Avatar"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-primary" />
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.displayName || "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="sm:hidden" onClick={() => onTabChange("scan")}>
                  Scan
                </DropdownMenuItem>
                <DropdownMenuItem className="sm:hidden" onClick={() => onTabChange("gallery")}>
                  Gallery
                </DropdownMenuItem>
                <DropdownMenuSeparator className="sm:hidden" />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
