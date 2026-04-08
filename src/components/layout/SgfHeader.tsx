"use client";

import React from "react";
import { Bell, ChevronDown, User } from "lucide-react";

export function SgfHeader() {
  return (
    <header className="fixed top-0 right-0 z-30 h-16 w-[calc(100%-16rem)] border-b border-white/5 bg-slate-950/40 backdrop-blur-md transition-all">
      <div className="flex h-full items-center justify-between px-10">
        {/* Active Entity Info */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Active Club</span>
            <div className="flex items-center gap-2 group cursor-pointer">
              <span className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">Federación</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Action icons & Profile */}
        <div className="flex items-center gap-6">
          <button className="relative p-1 text-slate-500 hover:text-emerald-400 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border-2 border-slate-950 shadow-[0_0_8px_#10b981]" />
          </button>
          
          {/* User Profile - Minimalist Avatar */}
          <div className="flex items-center gap-3 pl-4 border-l border-white/5 cursor-pointer group">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-white leading-tight group-hover:text-emerald-400 transition-colors">Rodrigo Zúñiga</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Super Admin</p>
            </div>
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden group-hover:border-emerald-500/50 transition-all shadow-lg ring-2 ring-emerald-500/0 group-hover:ring-emerald-500/20">
                <User className="w-5 h-5 text-slate-400 group-hover:text-emerald-400" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
