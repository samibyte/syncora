"use client";
import { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { MessageSquare, Send, Trash2, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { formatDateTime } from "@/lib/utils/date";
import type { Comment, Task } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface TaskCommentsProps {
  task: Task;
  onClose: () => void;
}

export function TaskComments({ task, onClose }: TaskCommentsProps) {
  const { user } = useAuthStore();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, mutate, isLoading } = useSWR<{ data: Comment[] }>(
    `/api/tasks/${task.id}/comments`,
    fetcher,
    { refreshInterval: 10000 }
  );

  const comments = data?.data ?? [];

  // Auto-scroll to latest comment
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to post comment");
        return;
      }
      setContent("");
      mutate();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments/${commentId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Failed to delete comment");
        return;
      }
      mutate();
      toast.success("Comment deleted");
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-sm text-foreground">Comments</h3>
          {comments.length > 0 && (
            <span className="text-[10px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
              {comments.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Task title context */}
      <div className="px-5 py-3 bg-muted/30 border-b border-border shrink-0">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Commenting on</p>
        <p className="text-sm font-semibold text-foreground truncate mt-0.5">{task.title}</p>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span className="text-sm">Loading comments...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
            <MessageSquare className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm font-semibold text-muted-foreground">No comments yet</p>
            <p className="text-xs text-muted-foreground/60">Be the first to share an update!</p>
          </div>
        ) : (
          comments.map((comment) => {
            const isOwn = comment.authorId === user?.id;
            return (
              <div key={comment.id} className={cn("flex gap-3", isOwn && "flex-row-reverse")}>
                {/* Avatar */}
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 border-2",
                  isOwn
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-secondary text-foreground border-border"
                )}>
                  {comment.authorName.charAt(0).toUpperCase()}
                </div>

                {/* Bubble */}
                <div className={cn("flex flex-col gap-1 max-w-[80%]", isOwn && "items-end")}>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-muted-foreground">
                      {isOwn ? "You" : comment.authorName}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60">
                      {formatDateTime(comment.createdAt)}
                    </span>
                  </div>
                  <div className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm leading-relaxed relative group",
                    isOwn
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-card border border-border text-foreground rounded-tl-sm"
                  )}>
                    <p className="whitespace-pre-wrap break-words">{comment.content}</p>

                    {/* Delete button (own comments or admin) */}
                    {(isOwn || user?.role === "admin") && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className={cn(
                          "absolute -top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full shadow-sm",
                          isOwn ? "-left-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white" : "-right-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white"
                        )}
                        title="Delete comment"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-border bg-card/50 shrink-0"
      >
        <div className="flex gap-2 items-end">
          <div className="flex-1 bg-background border border-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40 transition-all">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a comment... (Ctrl+Enter to send)"
              rows={2}
              className="w-full resize-none bg-transparent px-3 pt-2.5 pb-1.5 text-sm outline-none text-foreground placeholder:text-muted-foreground"
            />
            <div className="flex items-center justify-end px-2 pb-1.5">
              <span className={cn(
                "text-[10px] font-bold",
                content.length > 900 ? "text-destructive" : "text-muted-foreground/40"
              )}>
                {content.length}/1000
              </span>
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-lg shadow-primary/20"
            title="Send (Ctrl+Enter)"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
