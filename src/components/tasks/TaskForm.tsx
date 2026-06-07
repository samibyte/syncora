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

interface TaskFormProps {
  onSuccess: () => void;
  initialData?: TaskInput & { id: string };
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

  const {
    register,
    handleSubmit,
    reset,
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
    },
  });

  const onSubmit = async (values: TaskInput) => {
    try {
      const url = isEditing ? `/api/tasks/${initialData.id}` : "/api/tasks";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || `Failed to ${isEditing ? "update" : "create"} task`);
        return;
      }
      toast.success(`Task ${isEditing ? "updated" : "created"}`);
      if (!isEditing) reset();
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
