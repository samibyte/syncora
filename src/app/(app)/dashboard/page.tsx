"use client";
import Link from "next/link";
import { useDashboard } from "@/hooks/useDashboard";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusChart } from "@/components/dashboard/StatusChart";
import { PriorityChart } from "@/components/dashboard/PriorityChart";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Briefcase,
  CheckSquare,
  AlertCircle,
  Clock,
  Activity,
  ArrowRight,
  TrendingUp,
  Target,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { stats, isLoading } = useDashboard();

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Syncora Workspace</h1>
          <p className="text-muted-foreground text-sm">
            Overview of your team's projects and active tasks
          </p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-xl text-xs font-bold ring-1 ring-primary/20">
          <TrendingUp className="h-3.5 w-3.5" />
          Live Productivity Insights
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link href="/projects" className="flex flex-col items-center justify-center p-4 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-2xl transition group">
          <Briefcase className="h-5 w-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">New Project</span>
        </Link>
        <Link href="/tasks" className="flex flex-col items-center justify-center p-4 bg-secondary hover:bg-secondary/80 border border-border rounded-2xl transition group">
          <CheckSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">Create Task</span>
        </Link>
        <Link href="/team" className="flex flex-col items-center justify-center p-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-2xl transition group">
          <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Team Status</span>
        </Link>
        <Link href="/tasks" className="flex flex-col items-center justify-center p-4 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-2xl transition group">
          <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Urgent Tasks</span>
        </Link>

      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <StatCard
          title="Active Projects"
          value={stats.totalProjects}
          icon={Briefcase}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
          description="In progress initiatives"
        />
        <StatCard
          title="Pending Tasks"
          value={stats.pendingTasks}
          icon={Clock}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
          description="Awaiting completion"
        />
        <StatCard
          title="Completed"
          value={stats.completedTasks}
          icon={CheckSquare}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
          description="Successfully finished"
        />
        <StatCard
          title="Overdue"
          value={stats.overdueTasks}
          icon={AlertCircle}
          colorClass="text-rose-600"
          bgClass="bg-rose-50"
          description="Past deadline"
        />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-primary" />
              Task Status Distribution
            </h3>
          </div>
          <StatusChart data={stats.tasksByStatus} />
        </div>

        <div className="bg-card rounded-2xl border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-500" />
              Tasks by Priority
            </h3>
          </div>
          <PriorityChart data={stats.tasksByPriority} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Summaries */}
        <div className="lg:col-span-2 bg-card rounded-2xl border flex flex-col">
          <div className="p-6 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold">Project Progress</h3>
            </div>
            <Link
              href="/projects"
              className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
            >
              View Projects <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-6 space-y-6 flex-1">
            {stats.projectSummaries.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">No projects to show</p>
            ) : (
              stats.projectSummaries.map((proj) => (
                <div key={proj.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold">{proj.name}</h4>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                        {proj.deadlineStatus}
                      </p>
                    </div>
                    <span className="text-sm font-black text-primary">
                      {proj.completionPercentage}%
                    </span>
                  </div>
                  <Progress value={proj.completionPercentage} className="h-2 rounded-full" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card rounded-2xl border flex flex-col">
          <div className="p-6 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold">Activity Log</h3>
            </div>
            <Link
              href="/activity"
              className="text-xs text-muted-foreground hover:text-foreground font-bold"
            >
              All
            </Link>
          </div>
          <div className="p-6 space-y-4 flex-1">
            {stats.recentActivity.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">No recent activity</p>
            ) : (
              stats.recentActivity.slice(0, 6).map((log) => (
                <div key={log.id} className="flex items-start gap-3">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0 shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                  <div className="space-y-0.5">
                    <p className="text-xs leading-relaxed font-medium">{log.description}</p>
                    <p className="text-[10px] text-muted-foreground font-bold">
                      {formatDateTime(log.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
