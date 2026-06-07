"use client";
import { useState } from "react";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Briefcase, Trash2, Plus, Calendar, Clock, Edit2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { Input } from "@/components/ui/input";

export default function ProjectsPage() {
  const { projects, mutate, isLoading } = useProjects();
  const { tasks } = useTasks();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [sortBy, setSortBy] = useState("latest");

  const sortedProjects = [...projects].sort((a, b) => {
    switch (sortBy) {
      case "latest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "deadline":
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      case "updated":
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      default:
        return 0;
    }
  });

  const filteredProjects = sortedProjects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );


  const canManage = user?.role === "admin" || user?.role === "project_manager";

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to delete");
        return;
      }
      toast.success("Project deleted");
      mutate();
      setDeleteTarget(null);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  const getStatusColor = (status: Project["status"]) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "completed":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "on_hold":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-border";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Plan and monitor your team's initiatives"
      >
        {canManage && (
          <button
            onClick={() => {
              setEditTarget(null);
              setShowForm((v) => !v);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 active:translate-y-0 h-10"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        )}
      </PageHeader>

      {/* Add/Edit area */}
      {(showForm || editTarget) && (
        <div className="bg-card rounded-2xl border shadow-sm p-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">
              {editTarget ? "Edit Project" : "Create New Project"}
            </h3>
            <button
              onClick={() => {
                setShowForm(false);
                setEditTarget(null);
              }}
              className="text-sm text-muted-foreground hover:text-slate-900"
            >
              Cancel
            </button>
          </div>
          <ProjectForm
            initialData={editTarget || undefined}
            onSuccess={() => {
              mutate();
              setShowForm(false);
              setEditTarget(null);
            }}
          />
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-9 h-10 rounded-xl bg-card border-border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-900"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-10 px-3 bg-card border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
          >
            <option value="latest">Latest Created</option>
            <option value="deadline">Nearest Deadline</option>
            <option value="updated">Recently Updated</option>
          </select>
        </div>
      </div>


      {/* Projects list */}
      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
        {isLoading ? (
          <div className="col-span-full py-20 text-center text-muted-foreground">
            Loading projects...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              icon={Briefcase}
              title={searchQuery ? "No matching projects" : "No projects found"}
              description={searchQuery ? "Try a different search term." : "Start by creating a new project to organize your tasks."}
            />
          </div>
        ) : (
          filteredProjects.map((project) => {
            const projectTasks = tasks.filter((t) => t.projectId === project.id);
            const pendingCount = projectTasks.filter((t) => t.status !== "completed").length;

            return (
              <div
                key={project.id}
                className="group bg-card hover:bg-accent/5 rounded-2xl border transition-all duration-200 hover:shadow-md hover:border-primary/20 p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg tracking-tight group-hover:text-primary transition-colors">
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider",
                          getStatusColor(project.status),
                        )}
                      >
                        {project.status.replace("_", " ")}
                      </span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Due {project.deadline}</span>
                      </div>
                    </div>
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditTarget(project);
                          setShowForm(false);
                        }}
                        className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(project)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                  {project.description}
                </p>

                {/* Progress Bar */}
                <div className="space-y-1.5 mb-5">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="text-primary">{projectTasks.length > 0 ? Math.round((projectTasks.filter(t => t.status === "completed").length / projectTasks.length) * 100) : 0}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-500 ease-out"
                      style={{ 
                        width: `${projectTasks.length > 0 ? (projectTasks.filter(t => t.status === "completed").length / projectTasks.length) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t flex items-center justify-between">
                  <div className="flex -space-x-2">

                    <div className="w-7 h-7 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-[10px] font-bold text-primary">
                      {project.name.charAt(0)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-secondary/50 px-3 py-1 rounded-lg">
                    <Clock className="h-3 w-3 text-primary" />
                    <span>{pendingCount} Task{pendingCount !== 1 ? "s" : ""} Pending</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Project"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? All associated tasks will also be removed. This action cannot be undone.`}
        confirmText="Delete Project"
        loading={deleting}
      />
    </div>
  );
}
