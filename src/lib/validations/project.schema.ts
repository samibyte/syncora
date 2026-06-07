import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters").max(100),
  description: z.string().min(5, "Description must be at least 5 characters"),
  deadline: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  status: z.enum(["active", "completed", "on_hold"]),
  memberIds: z.array(z.string()).default([]),
});

export type ProjectInput = z.infer<typeof projectSchema>;
