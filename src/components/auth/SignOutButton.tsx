"use client";

import { signOut, useSession } from "next-auth/react";

const ROLE_LABELS: Record<string, string> = {
    SUPERADMIN: "Super Administrador",
    FEDERATION_ADMIN: "Admin Federación",
    CLUB_ADMIN: "Presidente de Club",
    CLUB_DELEGATE: "Delegado de Club",
    REFEREE: "Árbitro Oficial",
    PLAYER: "Jugador Federado",
    USER: "Usuario"
};

/**
 * Ejecuta el protocolo de Hard Logout:
 * 1. Expira todas las cookies accesibles por JS en este dominio.
 * 2. Delega a NextAuth para destruir la cookie HttpOnly del JWT server-side.
 * 3. callbackUrl: '/' — el middleware Anti-Fantasma detectará que no hay sesión
 *    y permitirá el acceso a la home. Evita el loop /login → dashboard.
 */
function hardLogout() {
    // Paso 1: Cookies accesibles por JS
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
        const name = cookie.split("=")[0].trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
    }
    // Paso 2: NextAuth destruye la sesión server-side
    signOut({ callbackUrl: "/", redirect: true });
}

/**
 * Botón reutilizable de cierre de sesión con Hard Logout integrado.
 * Usar en nav headers, sidebars, dropdowns, etc.
 */
export function SignOutButton({ className }: { className?: string }) {
    return (
        <button
            onClick={hardLogout}
            className={className ?? "flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-rose-400 transition-colors px-3 py-2 rounded-lg hover:bg-rose-950/30"}
        >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar Sesión
        </button>
    );
}

/**
 * Widget de identidad: muestra el usuario activo, su rol,
 * y el botón de SignOut con Hard Logout.
 * Usar en Sidebars y paneles de control.
 */
export function UserIdentityWidget() {
    const { data: session } = useSession();
    if (!session?.user) return null;

    const role = (session.user as any).role || "USER";
    const label = ROLE_LABELS[role] ?? role;

    return (
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-emerald-900 border border-emerald-600 flex items-center justify-center text-emerald-300 font-black text-sm">
                {session.user.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div className="text-left">
                <div className="text-white font-bold text-sm leading-tight">{session.user.name}</div>
                <div className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">{label}</div>
            </div>
            <div className="border-l border-slate-700 ml-1 pl-3">
                <SignOutButton />
            </div>
        </div>
    );
}
