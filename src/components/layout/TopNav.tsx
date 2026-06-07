"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, LogOut } from "lucide-react";
import { toast } from "sonner";

interface TopNavProps {
  onMenuClick?: () => void;
}

export function TopNav({ onMenuClick = () => {} }: TopNavProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocumentClick);
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) {
        throw new Error("Failed to sign out");
      }

      setMenuOpen(false);
      logout();
      toast.success("Signed out successfully");
      router.push("/login");
    } catch {
      toast.error("Unable to sign out. Please try again.");
    }
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 shrink-0 sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <button
          className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          onClick={onMenuClick}
          type="button"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end hidden sm:flex">
          <span className="text-xs font-bold text-foreground leading-none">
            {user?.name}
          </span>
          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
            {user?.role.replace("_", " ")}
          </span>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            className="h-9 w-9 rounded-full flex items-center justify-center outline-none ring-2 ring-transparent hover:ring-primary/20 transition-all"
            onClick={() => setMenuOpen((prev) => !prev)}
            type="button"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Open user menu"
          >
            <Avatar className="h-9 w-9 border-2 border-background">
              <AvatarFallback className="bg-primary text-white text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 mt-2 w-52 rounded-2xl border border-border bg-card p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100"
              role="menu"
            >
              <div className="px-3 py-2.5">
                <div className="flex flex-col space-y-0.5">
                  <span className="text-sm font-bold text-foreground">
                    {user?.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {user?.email}
                  </span>
                </div>
              </div>
              <div className="my-1.5 h-px bg-border" />
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-500/10 transition-colors"
                role="menuitem"
              >
                <LogOut className="mr-2.5 h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
