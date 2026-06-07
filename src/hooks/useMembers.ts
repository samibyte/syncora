"use client";
import useSWR from "swr";

import type { SafeUser } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useMembers() {
  // We can use a search param if we have a lot of users, but for now we'll fetch all
  const { data, error, isLoading } = useSWR<{ data: SafeUser[] }>(
    "/api/users",
    fetcher,
  );
  return {
    members: data?.data || [],
    isLoading,
    error,
  };
}
