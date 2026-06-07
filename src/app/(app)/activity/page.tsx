"use client";
import { useState } from "react";
import { useActivity } from "@/hooks/useActivity";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { Activity } from "lucide-react";
import { formatDateTime } from "@/lib/utils/date";
import type { ActivityAction } from "@/types";

const actionConfig: Record<
  ActivityAction,
  { label: string; dotColor: string; badgeClass: string }
> = {
  project_created: {
    label: "Project Created",
    dotColor: "bg-blue-500",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  project_updated: {
    label: "Project Updated",
    dotColor: "bg-amber-500",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  project_deleted: {
    label: "Project Deleted",
    dotColor: "bg-red-500",
    badgeClass: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
  task_created: {
    label: "Task Created",
    dotColor: "bg-emerald-500",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  task_updated: {
    label: "Task Updated",
    dotColor: "bg-sky-500",
    badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  },
  task_deleted: {
    label: "Task Deleted",
    dotColor: "bg-rose-500",
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
  task_status_updated: {
    label: "Status Updated",
    dotColor: "bg-indigo-500",
    badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  },
  member_added_to_project: {
    label: "Member Added",
    dotColor: "bg-teal-500",
    badgeClass: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200/20",
  },
  member_assigned_to_task: {
    label: "Assignment",
    dotColor: "bg-violet-500",
    badgeClass: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  },
};



export default function ActivityPage() {
  const LIMIT = 10;
  const [page, setPage] = useState(1);
  const { logs, total } = useActivity(page, LIMIT);

  return (
    <div>
      <PageHeader
        title="Activity Log"
        description="Recent system actions and events"
      />

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {logs.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No activity yet"
            description="Actions will appear here as you use the system."
          />
        ) : (
          <div className="divide-y">
            {logs.map((log) => {
              const cfg = actionConfig[log.action] || {
                label: log.action,
                dotColor: "bg-muted-foreground/30",
                badgeClass: "bg-muted text-muted-foreground border-border",
              };
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors"
                >
                  <div className="mt-1 flex-shrink-0">
                    <span
                      className={`w-2 h-2 rounded-full ${cfg.dotColor} inline-block mt-0.5`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.badgeClass}`}
                      >
                        {cfg.label}
                      </span>
                      <p className="text-sm text-foreground">
                        {log.description}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDateTime(log.createdAt)}
                    </p>
                  </div>
                </div>

              );
            })}
          </div>
        )}
      </div>

      <Pagination
        page={page}
        limit={LIMIT}
        total={total}
        onPageChange={setPage}
      />
    </div>
  );
}
