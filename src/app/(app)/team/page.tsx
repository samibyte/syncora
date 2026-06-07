"use client";
import { useMembers } from "@/hooks/useMembers";

import { useTasks } from "@/hooks/useTasks";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Users, Mail, CheckCircle2, Clock, ListTodo, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function TeamPage() {
  const { members, isLoading: membersLoading } = useMembers();
  const { tasks, isLoading: tasksLoading } = useTasks();
  const { user: currentUser } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");

  const isLoading = membersLoading || tasksLoading;

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );


  const getMemberStats = (memberId: string) => {
    const memberTasks = tasks.filter((t) => t.assignedMemberId === memberId);
    return {
      total: memberTasks.length,
      completed: memberTasks.filter((t) => t.status === "completed").length,
      pending: memberTasks.filter((t) => t.status !== "completed").length,
    };
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-rose-100 text-rose-700 border-rose-200";
      case "project_manager":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Our Team"
        description="Collaborate with your project members and managers"
      />

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search team members..."
          className="pl-9 h-10 bg-card rounded-xl border-slate-200"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-2xl" />
          ))
        ) : filteredMembers.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              icon={Users}
              title={searchQuery ? "No members match your search" : "No members found"}
              description={searchQuery ? "Try a different name or email." : "Invite your team to start collaborating."}
            />
          </div>
        ) : (
          filteredMembers.map((member) => {

            const stats = getMemberStats(member.id);
            return (
              <div
                key={member.id}
                className="bg-card rounded-2xl border p-6 flex flex-col items-center text-center space-y-4 hover:shadow-lg hover:border-primary/20 transition-all group"
              >
                <div className="relative">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-2xl font-black text-primary border-4 border-background shadow-inner">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  {member.id === currentUser?.id && (
                    <span className="absolute bottom-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md border-2 border-background">
                      YOU
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-lg">{member.name}</h3>
                  <div
                    className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                      getRoleBadgeColor(member.role),
                    )}
                  >
                    {member.role.replace("_", " ")}
                  </div>
                </div>

                <div className="w-full pt-4 border-t space-y-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                    <Mail className="h-3.5 w-3.5" />
                    <span>{member.email}</span>
                  </div>

                  {/* Workload Summary */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-muted/50 rounded-xl p-2 flex flex-col items-center">
                      <ListTodo className="h-3 w-3 text-primary mb-1" />
                      <span className="text-xs font-bold">{stats.total}</span>
                      <span className="text-[8px] font-bold text-muted-foreground uppercase">Tasks</span>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-2 flex flex-col items-center">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600 mb-1" />
                      <span className="text-xs font-bold text-emerald-600">{stats.completed}</span>
                      <span className="text-[8px] font-bold text-emerald-600/70 uppercase">Done</span>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-2 flex flex-col items-center">
                      <Clock className="h-3 w-3 text-amber-600 mb-1" />
                      <span className="text-xs font-bold text-amber-600">{stats.pending}</span>
                      <span className="text-[8px] font-bold text-amber-600/70 uppercase">Wait</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })

        )}
      </div>
    </div>
  );
}
