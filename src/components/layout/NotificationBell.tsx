"use client";
import { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import { Bell, Check, Trash2, Clock, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils/date";
import type { Notification } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data, mutate } = useSWR<{ data: Notification[] }>(
    "/api/notifications",
    fetcher,
    { refreshInterval: 15000 } // Refresh every 15s
  );

  const notifications = data?.data || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    mutate();
  };

  const markAllAsRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    mutate();
  };

  const deleteNotification = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    mutate();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all active:scale-95"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-4 min-w-[16px] px-1 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-background animate-in zoom-in duration-300">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 max-h-[500px] overflow-hidden flex flex-col bg-card border border-border rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/30">
            <h3 className="font-bold text-sm text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto min-h-0 flex-1">
            {notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                  <Bell className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground">All caught up!</p>
                <p className="text-xs text-muted-foreground/60">No new notifications for you right now.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "p-4 transition-colors relative group border-l-2",
                      n.isRead ? "bg-transparent border-transparent" : "bg-primary/5 border-primary"
                    )}
                  >
                    <div className="flex gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                        n.isRead ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                      )}>
                        {n.type === "task_assigned" && <Info className="h-4 w-4" />}
                        {n.type === "comment_added" && <Info className="h-4 w-4" />}
                        {n.type === "task_status_updated" && <Clock className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <p className={cn("text-xs leading-none mb-1", n.isRead ? "font-semibold text-muted-foreground" : "font-black text-foreground")}>
                          {n.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed mb-1.5">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 font-medium">
                          {formatDateTime(n.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Actions overlay */}
                    <div className="absolute right-2 top-4 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!n.isRead && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="p-1.5 bg-card border border-border rounded-lg text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                          title="Mark as read"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(n.id)}
                        className="p-1.5 bg-card border border-border rounded-lg text-muted-foreground hover:bg-destructive hover:text-white transition-all shadow-sm"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-border text-center bg-muted/10">
              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                Showing latest 50 notifications
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
