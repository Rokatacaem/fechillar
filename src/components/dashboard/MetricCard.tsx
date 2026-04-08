import React from "react";
import * as LucideIcons from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof LucideIcons;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function MetricCard({ title, value, icon, description, trend }: MetricCardProps) {
  const Icon = LucideIcons[icon] as React.ElementType;

  return (
    <div className="relative group overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-xl transition-all hover:border-emerald-500/20 hover:bg-slate-900/60 shadow-xl">
      {/* Background glow effects */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-500/5 blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
      
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            {title}
          </p>
          <h3 className="text-3xl font-extrabold tracking-tight text-white">
            {value}
          </h3>
        </div>
        
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800/50 border border-white/5 text-emerald-500 shadow-inner group-hover:scale-110 transition-transform">
          {Icon && <Icon className="h-6 w-6" />}
        </div>
      </div>

      {(description || trend) && (
        <div className="mt-4 flex items-center gap-2">
          {trend && (
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${trend.isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {trend.isPositive ? '+' : '-'}{trend.value}%
            </span>
          )}
          {description && (
            <p className="text-xs text-slate-500 font-medium">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Decorative emerald accent border on hover */}
      <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-emerald-500 to-transparent transition-all duration-500 group-hover:w-full" />
    </div>
  );
}
