import { NextResponse } from 'next/server'
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

/**
 * Retorna la URL del dashboard según el rol del usuario.
 * Fuente de verdad única para redirecciones post-login y anti-fantasma.
 */
function getDashboardForRole(role: string): string {
    if (role === 'SUPERADMIN' || role === 'FEDERATION_ADMIN' || role === 'ADMIN') return '/admin/dashboard';
    if (role === 'CLUB_ADMIN' || role === 'CLUB_DELEGATE') return '/dashboard';
    return '/player/dashboard'; // PLAYER, USER, fallback
}

export default auth((req) => {
    const hostname = req.headers.get('host') || ''
    const { pathname } = req.nextUrl

    const isLoggedIn = !!req.auth
    const role = (req.auth?.user as any)?.role || 'USER'

    // ─────────────────────────────────────────────────────────────
    // 1. ZONA DE EXCLUSIÓN: Estáticos, API, internos Next.js
    //    Se bypasean PRIMERO para no cargar lógica de sesión innecesaria.
    // ─────────────────────────────────────────────────────────────
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api/auth') || // NextAuth callbacks internos
        pathname.includes('.')              // Archivos estáticos (favicon, imágenes, etc.)
    ) {
        return NextResponse.next()
    }

    // ─────────────────────────────────────────────────────────────
    // 2. REGLA INVERSA — PROTOCOLO ANTI-FANTASMA (MÁXIMA PRIORIDAD)
    //    Un token válido en /login, / o cualquier zona pública activa
    //    una redirección de servidor INMEDIATA al dashboard del rol.
    //    El navegador nunca recibe el HTML de la página pública.
    // ─────────────────────────────────────────────────────────────
    const PUBLIC_AUTH_PATHS = ['/', '/login', '/sgf/login']
    if (isLoggedIn && PUBLIC_AUTH_PATHS.includes(pathname)) {
        const destination = getDashboardForRole(role)
        const redirectUrl = new URL(destination, req.url)
        const response = NextResponse.redirect(redirectUrl)
        // Cabecera de no-cache para evitar que el browser sirva una versión cacheada
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
        response.headers.set('Pragma', 'no-cache')
        return response
    }

    // ─────────────────────────────────────────────────────────────
    // 3. PROTECCIÓN EAGER: /admin y /sgf → Solo Roles Administrativos
    // ─────────────────────────────────────────────────────────────
    if (pathname.startsWith('/admin') || pathname.startsWith('/sgf')) {
        if (!isLoggedIn) {
            return NextResponse.redirect(new URL('/login', req.url))
        }
        const allowedAdmin = ['SUPERADMIN', 'FEDERATION_ADMIN', 'ADMIN']
        if (!allowedAdmin.includes(role)) {
            // Si intenta entrar a /sgf o /admin sin ser admin, mandarlo a su dashboard de jugador/club
            return NextResponse.redirect(new URL(getDashboardForRole(role), req.url))
        }
    }

    // ─────────────────────────────────────────────────────────────
    // 4. PROTECCIÓN EAGER: /dashboard → Admins en general
    // ─────────────────────────────────────────────────────────────
    if (pathname.startsWith('/dashboard')) {
        if (!isLoggedIn) {
            return NextResponse.redirect(new URL('/login', req.url))
        }
        const allowedDash = ['SUPERADMIN', 'FEDERATION_ADMIN', 'CLUB_ADMIN', 'CLUB_DELEGATE', 'REFEREE', 'ADMIN']
        if (!allowedDash.includes(role)) {
            return NextResponse.redirect(new URL('/player/dashboard', req.url))
        }
    }

    // ─────────────────────────────────────────────────────────────
    // 5. PROTECCIÓN EAGER: /club → Delegados de club
    // ─────────────────────────────────────────────────────────────
    if (pathname.startsWith('/club')) {
        if (!isLoggedIn) {
            return NextResponse.redirect(new URL('/login', req.url))
        }
        const allowedClub = ['SUPERADMIN', 'FEDERATION_ADMIN', 'CLUB_ADMIN', 'CLUB_DELEGATE']
        if (!allowedClub.includes(role)) {
            return NextResponse.redirect(new URL(getDashboardForRole(role), req.url))
        }
    }

    // ─────────────────────────────────────────────────────────────
    // 6. PROTECCIÓN EAGER: /player → Cualquier usuario autenticado
    // ─────────────────────────────────────────────────────────────
    if (pathname.startsWith('/player')) {
        if (!isLoggedIn) {
            return NextResponse.redirect(new URL('/login', req.url))
        }
    }

    // ─────────────────────────────────────────────────────────────
    // 7. PROTECCIÓN EAGER: /referee, /live → Árbitros y admins
    // ─────────────────────────────────────────────────────────────
    if (pathname.startsWith('/referee') || pathname.startsWith('/live')) {
        if (!isLoggedIn) {
            return NextResponse.redirect(new URL('/login', req.url))
        }
        const allowedReferee = ['REFEREE', 'ADMIN', 'SUPERADMIN', 'FEDERATION_ADMIN', 'CLUB_ADMIN']
        if (!allowedReferee.includes(role)) {
            return NextResponse.redirect(new URL(getDashboardForRole(role), req.url))
        }
    }

    // ─────────────────────────────────────────────────────────────
    // 8. REWRITE DE SUBDOMINIOS SGF (sgf.fechillar.cl)
    // ─────────────────────────────────────────────────────────────
    if (hostname.startsWith('sgf.')) {
        if (pathname === '/') return NextResponse.rewrite(new URL('/admin/dashboard', req.url))
        return NextResponse.rewrite(new URL(pathname, req.url))
    }

    return NextResponse.next()
})

export const config = {
    matcher: [
        /*
         * Hace match en TODAS las rutas excepto:
         * - _next/static (archivos estáticos compilados)
         * - _next/image (optimización de imágenes)
         * - favicon.ico
         * NOTA: Los archivos con extensión ya son filtrados en la Zona de Exclusión (Regla 1).
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}