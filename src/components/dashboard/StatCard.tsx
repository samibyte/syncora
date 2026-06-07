import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: string;
  colorClass?: string;
  bgClass?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  colorClass = 'text-indigo-600',
  bgClass = 'bg-indigo-50',
}: StatCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}

          {trend && (
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <span>↑</span> {trend}
            </p>
          )}
        </div>
        <div className={cn('rounded-xl p-2.5 shrink-0', bgClass)}>
          <Icon className={cn('h-5 w-5', colorClass)} />
        </div>
      </div>
    </div>
  );
}
