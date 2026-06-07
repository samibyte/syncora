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
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  project_updated: {
    label: "Project Updated",
    dotColor: "bg-amber-500",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  project_deleted: {
    label: "Project Deleted",
    dotColor: "bg-red-500",
    badgeClass: "bg-red-50 text-red-600 border-red-200",
  },
  task_created: {
    label: "Task Created",
    dotColor: "bg-emerald-500",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  task_updated: {
    label: "Task Updated",
    dotColor: "bg-sky-500",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
  },
  task_deleted: {
    label: "Task Deleted",
    dotColor: "bg-rose-500",
    badgeClass: "bg-rose-50 text-rose-600 border-rose-200",
  },
  task_status_updated: {
    label: "Status Updated",
    dotColor: "bg-indigo-500",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  member_added_to_project: {
    label: "Member Added",
    dotColor: "bg-teal-500",
    badgeClass: "bg-teal-50 text-teal-700 border-teal-200",
  },
  member_assigned_to_task: {
    label: "Assignment",
    dotColor: "bg-violet-500",
    badgeClass: "bg-violet-50 text-violet-700 border-violet-200",
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

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {logs.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No activity yet"
            description="Actions will appear here as you use the system."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => {
              const cfg = actionConfig[log.action] || {
                label: log.action,
                dotColor: "bg-slate-400",
                badgeClass: "bg-slate-50 text-slate-600 border-slate-200",
              };
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-colors"
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
                      <p className="text-sm text-slate-700">
                        {log.description}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
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
