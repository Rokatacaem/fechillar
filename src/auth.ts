import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient(); // In prod, use a singleton pattern for Prisma

export const { handlers, signIn, signOut, auth } = NextAuth({
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
                    const user = await prisma.user.findUnique({
                        where: { email },
                        include: { playerProfile: true }
                    });
                    console.log(" [AUTH_DEBUG] DB Query result:", user ? "User found" : "User not found");

                    if (!user) {
                        // For demo purposes, if no user exists, create one if it matches a specific "admin" email
                        // THIS IS FOR DEV ONLY
                        if (email === "admin@fechillar.cl" && credentials.password === "admin123") {
                            console.log(" [AUTH_DEBUG] Returning hardcoded admin user");
                            return {
                                id: "1",
                                name: "Admin Fechillar",
                                email: email,
                                role: "FEDERATION_ADMIN"
                            }
                        }
                        return null;
                    }

                    // Verify password (In real app, use bcrypt)
                    // For this MVP step, we will assume plain text match or create a proper seeding later.
                    // Implementing simple check for now:
                    console.log(" [AUTH_DEBUG] Verifying password...");
                    if (user.passwordHash === credentials.password) {
                        console.log(" [AUTH_DEBUG] Password match!");
                        return {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            role: user.role,
                            tenantId: user.playerProfile?.tenantId || null
                        };
                    } else {
                        console.log(" [AUTH_DEBUG] Password mismatch");
                    }

                    return null;
                } catch (error) {
                    console.error(" [AUTH_DEBUG] Error in authorize:", error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role || "USER";
                token.tenantId = (user as any).tenantId || null;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).role = token.role;
                (session.user as any).tenantId = token.tenantId;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
    }
});
