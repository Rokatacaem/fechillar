"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard,
  Shield, 
  Users, 
  Trophy, 
  ArrowLeftRight, 
  DollarSign
} from "lucide-react";

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Padrón Nacional", href: "/padron-nacional", icon: Users },
  { name: "Clubes", href: "/clubs", icon: Shield },
  { name: "Torneos", href: "/tournaments", icon: Trophy },
  { name: "Traspasos", href: "/transfers", icon: ArrowLeftRight },
  { name: "Finanzas", href: "/finances", icon: DollarSign },
];

export function SgfSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/5 bg-slate-950/40 backdrop-blur-md transition-transform">
      <div className="flex h-full flex-col overflow-y-auto px-6 py-8">
        {/* Logo Section - Identidad Visual SGF */}
        <div className="mb-12 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Shield className="w-5 h-5 text-slate-950" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white uppercase">
            SGF <span className="text-emerald-500">|</span> <span className="font-medium text-slate-400">Fechillar</span>
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                  isActive 
                    ? "bg-slate-900/50 text-emerald-500 border border-white/5" 
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 transition-colors",
                  isActive ? "text-emerald-500" : "group-hover:text-emerald-400"
                )} />
                {item.name}
                {isActive && (
                  <div className="ml-auto w-1 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer/Pro Badge */}
        <div className="mt-auto pt-6">
          <div className="rounded-xl bg-slate-900/40 p-4 border border-white/5 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Status</p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-slate-300 font-medium tracking-tight">Dark Pro Active</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
