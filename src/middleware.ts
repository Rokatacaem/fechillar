import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
    const hostname = req.headers.get('host') || ''
    const { pathname } = req.nextUrl

    // 1. ZONA DE EXCLUSIÓN CRÍTICA
    // No tocar nada que sea interno de Next.js o archivos estáticos
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.includes('.') ||
        pathname.includes('_nextjs') // Vital para Next.js 15+ y Turbopack
    ) {
        return NextResponse.next()
    }

    // 2. LÓGICA DE SUBDOMINIOS
    if (hostname.startsWith('sgf.')) {
        // Si entran a la raíz (sgf.lvh.me/), los mandamos a la carpeta dashboard
        if (pathname === '/') {
            return NextResponse.rewrite(new URL('/dashboard', req.url))
        }
        // Para cualquier otra ruta (ej: /players), lo deja pasar al grupo (sgf)
        return NextResponse.rewrite(new URL(pathname, req.url))
    }

    // 3. LANDING PÚBLICA (fechillar.cl o localhost:3000)
    return NextResponse.next()
}

export const config = {
    matcher: [
        // Ejecutar en todas las rutas excepto las estáticas
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}