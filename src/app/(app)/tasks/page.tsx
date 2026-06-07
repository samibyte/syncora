"use client";
import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useMembers } from "@/hooks/useMembers";
import { PageHeader } from "@/components/shared/PageHeader";

import { TaskForm } from "@/components/tasks/TaskForm";
import { TaskComments } from "@/components/tasks/TaskComments";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Paperclip,
  ExternalLink,
  MessageSquare,
  CheckSquare,


  Trash2,
  Plus,
  Filter,
  Calendar,
  AlertCircle,
  MoreVertical,
  Edit2,
  User,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import type { Task } from "@/types";
import { Input } from "@/components/ui/input";

export default function TasksPage() {
  const { user } = useAuthStore();
  const { projects } = useProjects();
  const { members } = useMembers();

  const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [assignedMemberId, setAssignedMemberId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { tasks, mutate, isLoading } = useTasks({
    projectId,
    status,
    priority,
    assignedMemberId,
  });

  const [sortBy, setSortBy] = useState("latest");

  const getPriorityWeight = (p: string) => {
    switch (p) {
      case "high": return 3;
      case "medium": return 2;
      case "low": return 1;
      default: return 0;
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    switch (sortBy) {
      case "latest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "deadline":
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      case "priority":
        return getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
      case "updated":
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      default:
        return 0;
    }
  });

  const filteredTasks = sortedTasks.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );


  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [editTarget, setEditTarget] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [commentTask, setCommentTask] = useState<Task | null>(null);

  const toggleSelectAll = () => {
    if (selectedTaskIds.length === filteredTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(filteredTasks.map((t) => t.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedTaskIds.length === 0) return;
    setIsBulkUpdating(true);
    try {
      // For a real app, I'd suggest a dedicated bulk API endpoint,
      // but for this demo I'll iterate or just simulate it.
      await Promise.all(
        selectedTaskIds.map((id) =>
          fetch(`/api/tasks/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          })
        )
      );
      toast.success(`Updated ${selectedTaskIds.length} tasks`);
      setSelectedTaskIds([]);
      mutate();
    } catch {
      toast.error("Bulk update failed");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTaskIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedTaskIds.length} tasks?`)) return;
    setIsBulkUpdating(true);
    try {
      await Promise.all(
        selectedTaskIds.map((id) =>
          fetch(`/api/tasks/${id}`, { method: "DELETE" })
        )
      );
      toast.success(`Deleted ${selectedTaskIds.length} tasks`);
      setSelectedTaskIds([]);
      mutate();
    } catch {
      toast.error("Bulk delete failed");
    } finally {
      setIsBulkUpdating(false);
    }
  };


  const canManage = user?.role === "admin" || user?.role === "project_manager";

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/tasks/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to delete task");
        return;
      }
      toast.success("Task deleted");
      mutate();
      setDeleteTarget(null);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusUpdate = async (task: Task, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to update status");
        return;
      }
      toast.success("Status updated");
      mutate();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "high":
        return "text-red-600 bg-red-50 border-red-100";
      case "medium":
        return "text-amber-600 bg-amber-50 border-amber-100";
      case "low":
        return "text-blue-600 bg-blue-50 border-blue-100";
      default:
        return "text-muted-foreground bg-muted border-border";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Manage your team's workload and track progress"
      >
        {canManage && (
          <button
            onClick={() => {
              setEditTarget(null);
              setShowForm((v) => !v);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20 transition-all h-10"
          >
            <Plus className="h-4 w-4" />
            Add Task
          </button>
        )}
      </PageHeader>

      {/* Filters */}
      <div className="bg-card rounded-2xl border p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-muted-foreground mr-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            className="pl-9 h-9 bg-muted border-none rounded-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="bg-muted px-3 py-1.5 rounded-lg text-sm outline-none border border-transparent focus:border-primary/30 transition-all min-w-[150px]"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-muted px-3 py-1.5 rounded-lg text-sm outline-none border border-transparent focus:border-primary/30 transition-all"
        >
          <option value="">All Status</option>
          <option value="todo">Todo</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="bg-muted px-3 py-1.5 rounded-lg text-sm outline-none border border-transparent focus:border-primary/30 transition-all"
        >
          <option value="">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          value={assignedMemberId}
          onChange={(e) => setAssignedMemberId(e.target.value)}
          className="bg-muted px-3 py-1.5 rounded-lg text-sm outline-none border border-transparent focus:border-primary/30 transition-all min-w-[150px]"
        >
          <option value="">All Members</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-muted px-3 py-1.5 rounded-lg text-sm outline-none border border-transparent focus:border-primary/30 transition-all font-medium"
        >
          <option value="latest">Latest</option>
          <option value="deadline">Deadline</option>
          <option value="priority">Priority</option>
          <option value="updated">Updated</option>
        </select>

        {(projectId || status || priority || assignedMemberId || sortBy !== "latest") && (
          <button
            onClick={() => {
              setProjectId("");
              setStatus("");
              setPriority("");
              setAssignedMemberId("");
              setSortBy("latest");
            }}
            className="text-xs font-semibold text-primary hover:underline ml-auto"
          >
            Clear All
          </button>
        )}


      </div>

      {/* Form area */}
      {(showForm || editTarget) && (
        <div className="bg-card rounded-2xl border p-6 shadow-sm border-primary/20 ring-4 ring-primary/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">
              {editTarget ? "Edit Task" : "Create New Task"}
            </h3>
            <button
              onClick={() => {
                setShowForm(false);
                setEditTarget(null);
              }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
          <TaskForm
            initialData={editTarget || undefined}
            defaultProjectId={projectId}
            onSuccess={() => {
              mutate();
              setShowForm(false);
              setEditTarget(null);
            }}
          />
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedTaskIds.length > 0 && (
        <div className="sticky top-4 z-50 bg-primary text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center justify-between mb-2 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2 rounded-lg">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-sm">{selectedTaskIds.length} Tasks Selected</p>
              <p className="text-[10px] opacity-80 uppercase font-black tracking-widest">Bulk Actions Active</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              onChange={(e) => handleBulkStatusUpdate(e.target.value)}
              disabled={isBulkUpdating}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-white/50"
            >
              <option value="" className="text-foreground">Change Status...</option>
              <option value="todo" className="text-foreground">Set Todo</option>
              <option value="in_progress" className="text-foreground">Set In Progress</option>
              <option value="completed" className="text-foreground">Set Completed</option>
            </select>
            <button
              onClick={handleBulkDelete}
              disabled={isBulkUpdating}
              className="bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-lg transition-colors border border-red-400/30"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setSelectedTaskIds([])}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="bg-card rounded-2xl border overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-20 text-center text-muted-foreground animate-pulse">
            Loading tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title={searchQuery ? "No matching tasks" : "No tasks found"}
            description={searchQuery ? "Try a different search term or project filter." : "Adjust your filters or create a new task to get started."}
          />
        ) : (
          <div className="divide-y overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted/50 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                      checked={selectedTaskIds.length === filteredTasks.length && filteredTasks.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-4">Task Details</th>

                  <th className="px-6 py-4">Assigned To</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Comments</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    className={cn(
                      "group hover:bg-muted/30 transition-colors",
                      selectedTaskIds.includes(task.id) && "bg-primary/5"
                    )}
                  >
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                        checked={selectedTaskIds.includes(task.id)}
                        onChange={() => toggleSelectOne(task.id)}
                      />
                    </td>
                    <td className="px-6 py-4 max-w-sm">
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => handleStatusUpdate(task, task.status === "completed" ? "todo" : "completed")}
                          className={cn(
                            "mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0",
                            task.status === "completed" 
                              ? "bg-emerald-500 border-emerald-500 text-white" 
                              : "border-slate-300 hover:border-primary"
                          )}
                        >
                          {task.status === "completed" && <CheckSquare className="h-3.5 w-3.5 shadow-sm" />}
                        </button>
                        <div className="space-y-1">
                          <p className={cn(
                            "font-bold text-sm tracking-tight",
                            task.status === "completed" && "line-through text-muted-foreground"
                          )}>
                            {task.title}
                          </p>

                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {task.description}
                        </p>
                        <p className="text-[10px] font-bold text-primary uppercase">
                          {projects.find(p => p.id === task.projectId)?.name || "Unknown Project"}
                        </p>
                        {task.attachments && task.attachments.length > 0 && (
                          <div className="mt-1.5 space-y-1">
                            {task.attachments.map((att) => (
                              <a
                                key={att.id}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground hover:text-primary bg-muted/40 hover:bg-primary/10 w-fit px-1.5 py-0.5 rounded border border-border hover:border-primary/30 transition-all"
                                title={`Open ${att.name}`}
                              >
                                <Paperclip className="h-2.5 w-2.5 shrink-0" />
                                <span className="max-w-[120px] truncate">{att.name}</span>
                                <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-60" />
                              </a>
                            ))}
                          </div>
                        )}

                      </div>
                    </div>
                    </td>


                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold border border-border">
                          {task.assignedMemberName?.[0] || <User className="h-3 w-3" />}
                        </div>
                        <span className="text-xs font-medium">{task.assignedMemberName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{task.dueDate}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-tighter px-2.5 py-1 rounded-full border",
                        getPriorityColor(task.priority)
                      )}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusUpdate(task, e.target.value)}
                        disabled={user?.role === "team_member" && user?.id !== task.assignedMemberId}
                        className={cn(
                          "text-xs font-semibold px-2 py-1 rounded-lg border bg-background outline-none transition-all focus:ring-2 cursor-pointer",
                          task.status === "completed" ? "text-emerald-700 bg-emerald-50 border-emerald-200" :
                          task.status === "in_progress" ? "text-blue-700 bg-blue-50 border-blue-200" :
                          "text-muted-foreground bg-muted border-border"
                        )}
                      >

                        <option value="todo">Todo</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setCommentTask(task)}
                        className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors relative"
                        title="View comments"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {canManage && (
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => {
                              setEditTarget(task);
                              setShowForm(false);
                            }}
                            className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => setDeleteTarget(task)}
                            className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Task"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmText="Delete Task"
        loading={deleting}
      />

      {/* Comments Side Panel */}
      {commentTask && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setCommentTask(null)}
          />
          {/* Panel */}
          <div className="relative w-full max-w-md h-full bg-background border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <TaskComments
              task={commentTask}
              onClose={() => setCommentTask(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
