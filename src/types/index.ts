// --- Auth & Users ---
export type UserRole = "admin" | "project_manager" | "team_member";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
}

export type SafeUser = Omit<User, "passwordHash">;

// --- Projects ---
export type ProjectStatus = "active" | "completed" | "on_hold";

export interface Project {
  id: string;
  name: string;
  description: string;
  deadline: string;
  status: ProjectStatus;
  memberIds: string[];
  createdAt: string;

  updatedAt: string;
}

// --- Tasks ---
export type TaskPriority = "high" | "medium" | "low";
export type TaskStatus = "todo" | "in_progress" | "completed";

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: string;
  type: string;
  uploadedAt: string;
}

export interface Task {
  id: string;
  projectId: string; // Reference to Project
  title: string;
  description: string;
  assignedMemberId: string; // Reference to User.id
  assignedMemberName: string; // Denormalized for easy display
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}


// --- Activity Log ---
export type ActivityAction =
  | "project_created"
  | "project_updated"
  | "project_deleted"
  | "task_created"
  | "task_updated"
  | "task_deleted"
  | "task_status_updated"
  | "member_added_to_project"
  | "member_assigned_to_task";

export interface ActivityLog {
  id: string;
  action: ActivityAction;
  description: string;
  userId: string;
  createdAt: string;
}

// --- Comments ---
export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

// --- Notifications ---
export type NotificationType =
  | "task_assigned"
  | "comment_added"
  | "task_status_updated"
  | "task_deadline_soon";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  taskId?: string;
  projectId?: string;
  isRead: boolean;
  createdAt: string;
}

// --- DB Shape ---
export interface Database {
  users: User[];
  projects: Project[];
  tasks: Task[];
  activityLogs: ActivityLog[];
  comments: Comment[];
  notifications: Notification[];
}



// --- API Response ---
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

// --- Dashboard & Analytics ---
export interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  recentActivity: ActivityLog[];
  projectSummaries: {
    id: string;
    name: string;
    pendingCount: number;
    completionPercentage: number;
    deadlineStatus: string; // e.g., "Deadline in 2 days"
  }[];
  tasksByPriority: { name: string; value: number }[];
  tasksByStatus: { name: string; value: number }[];
}
