"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  projectSchema,
  type ProjectInput,
} from "@/lib/validations/project.schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useMembers } from "@/hooks/useMembers";
import { PROJECT_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";


interface ProjectFormProps {
  onSuccess: () => void;
  initialData?: any; // Avoiding deep type mismatch for now
}


export function ProjectForm({ onSuccess, initialData }: ProjectFormProps) {
  const isEditing = !!initialData;
  const { members } = useMembers();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: zodResolver(projectSchema) as any,
    mode: "onBlur",

    defaultValues: initialData || {
      name: "",
      description: "",
      deadline: "",
      status: "active",
      memberIds: [],
    },
  });

  const selectedMembers = watch("memberIds") || [];

  const toggleMember = (id: string) => {
    const current = [...selectedMembers];
    const index = current.indexOf(id);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(id);
    }
    setValue("memberIds", current);
  };

  const onSubmit = async (values: any) => {
    try {
      const payload: ProjectInput = {
        name: values.name,
        description: values.description,
        deadline: values.deadline,
        status: values.status,
        memberIds: values.memberIds || [],
      };

      const url = isEditing
        ? `/api/projects/${initialData.id}`
        : "/api/projects";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || `Failed to ${isEditing ? "update" : "create"} project`);
        return;
      }
      toast.success(`Project ${isEditing ? "updated" : "created"}`);
      if (!isEditing) reset();
      onSuccess();
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Project Name</Label>
        <Input
          id="name"
          placeholder="e.g. Website Redesign"
          className="h-10 rounded-xl"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message?.toString()}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Brief overview of the project..."
          className="min-h-[100px] rounded-xl"
          {...register("description")}
        />
        {errors.description && (
          <p className="text-xs text-destructive">
            {errors.description.message?.toString()}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="deadline">Deadline</Label>
          <Input
            id="deadline"
            type="date"
            className="h-10 rounded-xl"
            {...register("deadline")}
          />
          {errors.deadline && (
            <p className="text-xs text-destructive">{errors.deadline.message?.toString()}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            className="w-full h-10 bg-background border rounded-xl px-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/20"
            {...register("status")}
          >
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1).replace("_", " ")}
              </option>
            ))}
          </select>
          {errors.status && (
            <p className="text-xs text-destructive">{errors.status.message?.toString()}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Assign Team Members</Label>
        <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-xl border border-slate-200 min-h-[50px]">
          {members.length === 0 ? (
            <p className="text-xs text-muted-foreground">No members available</p>
          ) : (
            members.map((member) => {
              const isSelected = selectedMembers.includes(member.id);
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => toggleMember(member.id)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-all border",
                    isSelected
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:border-primary/50"
                  )}
                >
                  {member.name}
                </button>
              );
            })
          )}
        </div>
        {errors.memberIds && (
          <p className="text-xs text-destructive">{errors.memberIds.message?.toString()}</p>
        )}
      </div>


      <div className="flex gap-3 pt-2">

        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 h-10 rounded-xl font-semibold"
        >
          {isSubmitting
            ? isEditing
              ? "Updating..."
              : "Creating..."
            : isEditing
              ? "Update Project"
              : "Create Project"}
        </Button>
      </div>
    </form>
  );
}
