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

                const email = (credentials.email as string).toLowerCase().trim();
                const password = (credentials.password as string).trim();

                // 1. Acceso Prioritario para Superadmin (Recuperación/Dev)
                if (email === "admin@fechillar.cl" && password === "admin123") {
                    const masterAdminId = "6c3a3a52-c0a7-454e-bc62-088209b04052";
                    
                    const adminUser = await prisma.user.upsert({
                        where: { id: masterAdminId },
                        update: { 
                            email, 
                            role: "SUPERADMIN",
                            name: "Rodrigo Zúñiga (Admin)"
                        },
                        create: {
                            id: masterAdminId,
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
