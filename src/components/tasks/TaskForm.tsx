"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { taskSchema, type TaskInput } from "@/lib/validations/task.schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useProjects } from "@/hooks/useProjects";
import { useMembers } from "@/hooks/useMembers";
import { PRIORITY_LEVELS, TASK_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Paperclip, FileText, X as XIcon, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Attachment } from "@/types";



interface TaskFormProps {
  onSuccess: () => void;
  initialData?: any; // Simpler for demo
  defaultProjectId?: string;
}

export function TaskForm({
  onSuccess,
  initialData,
  defaultProjectId,
}: TaskFormProps) {
  const isEditing = !!initialData;
  const { projects } = useProjects();
  const { members } = useMembers();

  const [attachments, setAttachments] = useState<Attachment[]>(initialData?.attachments || []);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    mode: "onBlur",
    defaultValues: initialData || {
      projectId: defaultProjectId || "",
      title: "",
      description: "",
      assignedMemberId: "",
      dueDate: "",
      priority: "medium",
      status: "todo",
      attachments: [],
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const toastId = toast.loading("Uploading files...");

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
          method: "POST",
          body: file,
        });

        if (!response.ok) throw new Error(`Upload failed for ${file.name}`);

        const blob = await response.json();

        return {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          url: blob.url,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          type: file.type,
          uploadedAt: new Date().toISOString()
        };
      });

      const newAttachments = await Promise.all(uploadPromises);
      const updated = [...attachments, ...newAttachments];
      
      setAttachments(updated);
      setValue("attachments", updated);
      toast.success("Files uploaded", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Some files failed to upload", { id: toastId });
    } finally {
      setIsUploading(false);
      // Clear the input so the same file can be selected again
      e.target.value = "";
    }
  };


  const removeAttachment = (id: string) => {
    const updated = attachments.filter(a => a.id !== id);
    setAttachments(updated);
    setValue("attachments", updated);
  };

  const onSubmit = async (values: TaskInput) => {
    try {
      const url = isEditing ? `/api/tasks/${initialData.id}` : "/api/tasks";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, attachments }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || `Failed to ${isEditing ? "update" : "create"} task`);
        return;
      }
      toast.success(`Task ${isEditing ? "updated" : "created"}`);
      if (!isEditing) {
        reset();
        setAttachments([]);
      }
      onSuccess();
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="projectId">Project</Label>
          <select
            id="projectId"
            disabled={isEditing}
            className="w-full h-10 bg-background border rounded-xl px-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            {...register("projectId")}
          >
            <option value="">Select Project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {errors.projectId && (
            <p className="text-xs text-destructive">{errors.projectId.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="assignedMemberId">Assign To</Label>
          <select
            id="assignedMemberId"
            className="w-full h-10 bg-background border rounded-xl px-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/20"
            {...register("assignedMemberId")}
          >
            <option value="">Select Member</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.role.replace("_", " ")})
              </option>
            ))}
          </select>
          {errors.assignedMemberId && (
            <p className="text-xs text-destructive">
              {errors.assignedMemberId.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="title">Task Title</Label>
        <Input
          id="title"
          placeholder="e.g. Design Homepage"
          className="h-10 rounded-xl"
          {...register("title")}
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Task Description</Label>
        <Textarea
          id="description"
          placeholder="What needs to be done?"
          className="min-h-[80px] rounded-xl"
          {...register("description")}
        />
        {errors.description && (
          <p className="text-xs text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            type="date"
            className="h-10 rounded-xl px-2"
            {...register("dueDate")}
          />
          {errors.dueDate && (
            <p className="text-xs text-destructive">{errors.dueDate.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="priority">Priority</Label>
          <select
            id="priority"
            className="w-full h-10 bg-background border rounded-xl px-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/20"
            {...register("priority")}
          >
            {PRIORITY_LEVELS.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            className="w-full h-10 bg-background border rounded-xl px-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/20"
            {...register("status")}
          >
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1).replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Attachments Section */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-primary" />
          Attachments
        </Label>
        
        <div className={cn(
          "border-2 border-dashed rounded-xl p-4 transition-colors text-center",
          isUploading ? "opacity-50 cursor-not-allowed bg-muted" : "hover:border-primary/50"
        )}>
          <input
            type="file"
            id="attachments"
            multiple
            disabled={isUploading}
            className="hidden"
            onChange={handleFileUpload}
          />
          <label
            htmlFor="attachments"
            className={cn(
              "flex flex-col items-center gap-1",
              isUploading ? "cursor-not-allowed" : "cursor-pointer text-primary font-bold text-xs"
            )}
          >
            <Paperclip className={cn("h-6 w-6 mb-1 opacity-50", isUploading && "animate-bounce")} />
            {isUploading ? "Uploading..." : "Click to upload files"}
            <span className="text-muted-foreground font-medium uppercase text-[9px]">PDF, PNG, JPG up to 10MB</span>
          </label>
        </div>


        {attachments.length > 0 && (
          <div className="grid gap-2 mt-3">
            {attachments.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg border text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate font-medium">{file.name}</span>
                  <span className="text-[10px] text-muted-foreground">({file.size})</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(file.id)}
                  className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>


      <div className="pt-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-10 rounded-xl font-semibold shadow-lg shadow-primary/20"
        >
          {isSubmitting
            ? isEditing
              ? "Saving..."
              : "Creating..."
            : isEditing
              ? "Save Changes"
              : "Create Task"}
        </Button>
      </div>
    </form>
  );
}
