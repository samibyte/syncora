"use client";
import useSWR from "swr";

import type { Task } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface UseTasksOptions {
  projectId?: string;
  status?: string;
  priority?: string;
  assignedMemberId?: string;
}

export function useTasks(options: UseTasksOptions = {}) {
  const query = new URLSearchParams();
  if (options.projectId) query.append("projectId", options.projectId);
  if (options.status) query.append("status", options.status);
  if (options.priority) query.append("priority", options.priority);
  if (options.assignedMemberId) query.append("assignedMemberId", options.assignedMemberId);

  const url = `/api/tasks?${query.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<{ data: Task[] }>(
    url,
    fetcher,
  );

  return {
    tasks: data?.data || [],
    isLoading,
    error,
    mutate,
  };
}
