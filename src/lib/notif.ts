import type { Database, NotificationType } from "@/types";
import { generateId } from "@/lib/utils/id";

interface CreateNotificationParams {
  db: Database;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  taskId?: string;
  projectId?: string;
}

export function createNotification({
  db,
  userId,
  type,
  title,
  message,
  taskId,
  projectId,
}: CreateNotificationParams) {
  if (!db.notifications) db.notifications = [];

  const notification = {
    id: generateId(),
    userId,
    type,
    title,
    message,
    taskId,
    projectId,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  db.notifications.unshift(notification);

  // Keep max 100 notifications per user
  const userNotifications = db.notifications.filter((n) => n.userId === userId);
  if (userNotifications.length > 100) {
    // Basic cleanup: find oldest for this user and remove it
    const oldestId = userNotifications[userNotifications.length - 1].id;
    db.notifications = db.notifications.filter((n) => n.id !== oldestId);
  }
}
