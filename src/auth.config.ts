import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role || "USER";
                token.tenantId = (user as any).tenantId || null;
                token.managedClubId = (user as any).managedClubId || null;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.sub; // Inject original DB id
                (session.user as any).role = token.role;
                (session.user as any).tenantId = token.tenantId;
                (session.user as any).managedClubId = token.managedClubId;
            }
            return session;
        },
        authorized({ auth, request: { nextUrl } }) {
            // Lógica básica de autorización si se prefiere usar el middleware integrado
            // Por ahora mantenemos la lógica custom en middleware.ts
            return true;
        },
    },
    providers: [], // Los providers se inyectan en auth.ts para no romper el Edge Runtime
} satisfies NextAuthConfig;
