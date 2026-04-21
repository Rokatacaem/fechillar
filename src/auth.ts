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

                const email = credentials.email as string;

                try {
                    console.log(" [AUTH_DEBUG] Attempting to find user in DB:", email);
                    // Find user in DB
                    const user = await prisma.user.findFirst({
                        where: { email },
                        include: { playerProfile: true }
                    });
                    console.log(" [AUTH_DEBUG] DB Query result:", user ? "User found" : "User not found");

                    if (!user) {
                        // FOR DEV ONLY: Hardcoded admin
                        // FOR DEV ONLY: Sincronización de Superadmin con la DB Real
                        if (email === "admin@fechillar.cl" && credentials.password === "admin123") {
                            const adminUser = await prisma.user.upsert({
                                where: { email },
                                update: { role: "SUPERADMIN" },
                                create: {
                                    email,
                                    name: "Rodrigo Zúñiga (Admin)",
                                    role: "SUPERADMIN",
                                    passwordHash: "admin123", // En prod esto no se usará así
                                }
                            });

                            return {
                                id: adminUser.id,
                                name: adminUser.name,
                                email: adminUser.email,
                                role: adminUser.role,
                                tenantId: null // Global
                            }
                        }
                        return null;
                    }

                    if (user.passwordHash === credentials.password) {
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
