import { z } from "zod";

export const taskSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  title: z.string().min(2, "Task title must be at least 2 characters").max(100),
  description: z.string().min(5, "Description must be at least 5 characters"),
  assignedMemberId: z.string().min(1, "Please assign to a member"),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  priority: z.enum(["high", "medium", "low"]),
  status: z.enum(["todo", "in_progress", "completed"]),
  attachments: z.array(z.object({
    id: z.string(),
    name: z.string(),
    url: z.string(),
    size: z.string(),
    type: z.string(),
    uploadedAt: z.string()
  })).optional(),
});


export type TaskInput = z.infer<typeof taskSchema>;
