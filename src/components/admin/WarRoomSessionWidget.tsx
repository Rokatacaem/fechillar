"use client";

import { signOut } from "next-auth/react";
import { LogOut, Shield } from "lucide-react";
import { useState } from "react";

const ROLE_CONFIG: Record<string, { label: string; color: string; glow: string; badge: string }> = {
    SUPERADMIN: {
        label: "SUPER ADMIN",
        color: "text-rose-400",
        glow: "shadow-[0_0_12px_rgba(239,68,68,0.4)]",
        badge: "bg-rose-900/60 border-rose-500/50 text-rose-400",
    },
    FEDERATION_ADMIN: {
        label: "ADMIN FEDERACIÓN",
        color: "text-amber-400",
        glow: "shadow-[0_0_12px_rgba(245,158,11,0.3)]",
        badge: "bg-amber-900/60 border-amber-500/50 text-amber-400",
    },
    CLUB_ADMIN: {
        label: "ADMIN CLUB",
        color: "text-emerald-400",
        glow: "",
        badge: "bg-emerald-900/60 border-emerald-500/50 text-emerald-400",
    },
};

/**
 * Widget de identidad de operador para el War Room.
 * Recibe datos del Server Component padre (ya autenticado).
 * Ejecuta Hard Logout: limpia cookies JS + signOut({ callbackUrl: '/' }).
 */
export function WarRoomSessionWidget({
    name,
    role,
}: {
    name: string;
    role: string;
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const config = ROLE_CONFIG[role] ?? {
        label: role,
        color: "text-slate-300",
        glow: "",
        badge: "bg-slate-800 border-slate-600 text-slate-300",
    };

    // Iniciales del usuario (máx. 2 chars)
    const initials = name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();

    const hardLogout = () => {
        // Limpia cookies accesibles por JS
        document.cookie.split(";").forEach((cookie) => {
            const cookieName = cookie.split("=")[0].trim();
            document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
            document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
        });
        // NextAuth destruye la cookie HttpOnly
        signOut({ callbackUrl: "/", redirect: true });
    };

    return (
        <div className="relative">
            {/* Trigger del widget */}
            <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-3 group"
                aria-label="Menú de operador"
            >
                {/* Info del operador */}
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-white leading-tight group-hover:text-rose-300 transition-colors">
                        {name}
                    </p>
                    <span
                        className={`inline-block text-[9px] font-black tracking-[0.15em] uppercase border rounded-full px-2 py-0.5 ${config.badge}`}
                    >
                        {config.label}
                    </span>
                </div>

                {/* Avatar circular con iniciales */}
                <div className="relative flex-shrink-0">
                    <div
                        className={`w-10 h-10 rounded-full bg-slate-900 border-2 border-rose-500/70 flex items-center justify-center font-black text-sm text-rose-300 transition-all group-hover:border-rose-400 ${config.glow}`}
                    >
                        {initials}
                    </div>
                    {/* Indicador de sesión activa */}
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#070b14] shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                </div>
            </button>

            {/* Dropdown del operador */}
            {menuOpen && (
                <>
                    {/* Backdrop para cerrar */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setMenuOpen(false)}
                    />

                    <div className="absolute right-0 top-14 z-50 w-60 rounded-xl border border-slate-700/80 bg-[#0d1424]/95 backdrop-blur-md shadow-2xl shadow-black/60 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-150">
                        {/* Header del dropdown */}
                        <div className="px-4 py-4 border-b border-slate-800 bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`w-10 h-10 rounded-full bg-slate-900 border-2 border-rose-500/70 flex items-center justify-center font-black text-sm text-rose-300 ${config.glow}`}
                                >
                                    {initials}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{name}</p>
                                    <span className={`text-[9px] font-black tracking-widest uppercase ${config.color}`}>
                                        {config.label}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Acceso al nivel de seguridad */}
                        <div className="px-4 py-3 border-b border-slate-800">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                <Shield className="w-3 h-3" />
                                Nivel de Acceso
                            </div>
                            <p className={`text-xs font-black mt-1 ${config.color}`}>
                                Autorización Global · Nivel 5
                            </p>
                        </div>

                        {/* CTA de logout — Zona de peligro */}
                        <div className="p-2">
                            <button
                                onClick={hardLogout}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all text-left font-bold"
                            >
                                <LogOut className="w-4 h-4 flex-shrink-0" />
                                <span>Cerrar Sesión</span>
                                <span className="ml-auto text-[9px] text-slate-600 font-mono">
                                    HARD LOGOUT
                                </span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
