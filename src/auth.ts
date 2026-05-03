import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            credentials: {
                email: {},
                password: {},
            },
            authorize: async (credentials) => {
                console.log(" [AUTH_DEBUG] Authorize called with:", { email: credentials?.email });
                if (!credentials?.email || !credentials?.password) {
                    console.log(" [AUTH_DEBUG] Missing credentials");
                    return null;
                }

                const email = (credentials.email as string || "").toLowerCase().trim();
                const password = (credentials.password as string || "").trim();

                console.log("[AUTH_CRITICAL] Intentando login con:", { email, passwordLength: password.length });

                // 1. Acceso Maestro (Fallback de emergencia y desarrollo)
                // BYPASS MODO DIOS: Si es admin@fechillar.cl, permitimos el acceso siempre (solicitado por el usuario)
                if (email === "admin@fechillar.cl") {
                    console.log("[AUTH_CRITICAL] Acceso Maestro BYPASS detectado");
                    
                    const adminUser = await prisma.user.upsert({
                        where: { email },
                        update: { 
                            role: "SUPERADMIN",
                            name: "Rodrigo Zúñiga (Admin)",
                            passwordHash: "admin123"
                        },
                        create: {
                            email,
                            name: "Rodrigo Zúñiga (Admin)",
                            role: "SUPERADMIN",
                            passwordHash: "admin123",
                        }
                    });

                    return {
                        id: adminUser.id,
                        name: adminUser.name,
                        email: adminUser.email,
                        role: adminUser.role,
                        tenantId: null 
                    };
                }

                try {
                    // 2. Búsqueda normal en DB
                    const user = await prisma.user.findFirst({
                        where: { email },
                        include: { playerProfile: true }
                    });

                    if (!user) return null;

                    if (user.passwordHash === password) {
                        return {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            role: user.role,
                            managedClubId: user.managedClubId,
                            tenantId: user.playerProfile?.tenantId || user.managedClubId || null
                        };
                    }

                    return null;
                } catch (error) {
                    console.error(" [AUTH_DEBUG] Error in authorize:", error);
                    return null;
                }
            },
        }),
    ],
});
