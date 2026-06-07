import useSWR from "swr";
import type { Project } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useProjects() {
  const { data, error, isLoading, mutate } = useSWR<{ data: Project[] }>(
    "/api/projects",
    fetcher,
  );
  return {
    projects: data?.data || [],
    isLoading,
    error,
    mutate,
  };
}
