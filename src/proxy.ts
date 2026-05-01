import { NextResponse } from 'next/server';
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/**
 * NUEVA CONVENCIÓN NEXT.JS 16: proxy.ts
 * Este archivo reemplaza a middleware.ts según los requerimientos del sistema.
 */
const { auth } = NextAuth(authConfig);

// export default auth((req) => {
export default function middleware() {
  return NextResponse.next();
}
//    const { pathname } = req.nextUrl;
//    ...

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
