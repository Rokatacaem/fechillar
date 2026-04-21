"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, ChevronDown, User, Settings, Shield } from "lucide-react";
import { useSession } from "next-auth/react";
import { SignOutButton } from "@/components/auth/SignOutButton";

/**
 * Header principal del panel SGF.
 *
 * HARD LOGOUT:
 * signOut({ callbackUrl: '/' }) destruye el JWT de NextAuth.
 * La función hardLogout() adicionalmente fuerza la expiración de todas
 * las cookies del dominio desde el cliente antes de delegar a NextAuth,
 * garantizando que no queden tokens residuales en el navegador.
 */
export function SgfHeader() {
    const { data: session } = useSession();
    const [profileOpen, setProfileOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const userName = session?.user?.name ?? "Administrador";
    const userRole = (session?.user as any)?.role ?? "SUPERADMIN";

    const roleLabel: Record<string, string> = {
        SUPERADMIN: "Super Admin",
        FEDERATION_ADMIN: "Admin Federación",
        CLUB_ADMIN: "Admin Club",
        CLUB_DELEGATE: "Delegado",
        REFEREE: "Árbitro",
        PLAYER: "Jugador",
    };

    // Cierra el dropdown al hacer clic fuera del panel
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Hard Logout delegado al componente canónico SignOutButton (@/components/auth/SignOutButton).
    // Protocolo: limpieza de cookies JS + signOut({ callbackUrl: '/' }) server-side.


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

                    {/* User Profile Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setProfileOpen((v) => !v)}
                            className="flex items-center gap-3 pl-4 border-l border-white/5 cursor-pointer group"
                        >
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-white leading-tight group-hover:text-emerald-400 transition-colors">
                                    {userName}
                                </p>
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">
                                    {roleLabel[userRole] ?? userRole}
                                </p>
                            </div>
                            <div className="relative">
                                <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden group-hover:border-emerald-500/50 transition-all shadow-lg ring-2 ring-emerald-500/0 group-hover:ring-emerald-500/20">
                                    <User className="w-5 h-5 text-slate-400 group-hover:text-emerald-400" />
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950" />
                            </div>
                        </button>

                        {/* Dropdown Menu */}
                        {profileOpen && (
                            <div className="absolute right-0 top-12 w-52 rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-sm shadow-2xl py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                                {/* User info header */}
                                <div className="px-4 py-3 border-b border-white/5">
                                    <p className="text-xs font-bold text-white truncate">{userName}</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">
                                        {roleLabel[userRole] ?? userRole}
                                    </p>
                                </div>

                                {/* Menu Items */}
                                <div className="py-1">
                                    <button
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                                    >
                                        <Settings className="w-4 h-4 text-slate-500" />
                                        Configuración
                                    </button>
                                    <button
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                                    >
                                        <Shield className="w-4 h-4 text-slate-500" />
                                        Mi Perfil
                                    </button>
                                </div>

                                {/* Sign Out — Zona de peligro: Hard Logout via SignOutButton canónico */}
                                <div className="border-t border-white/5 py-1 px-1">
                                    <SignOutButton className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors rounded-lg" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
