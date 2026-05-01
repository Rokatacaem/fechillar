import { PrismaClient } from "@prisma/client";

/**
 * Singleton de PrismaClient para Next.js.
 * Patrón oficial: https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
 * 
 * IMPORTANTE: En entornos con Prisma Accelerate (db.prisma.io), la sesión TLS puede
 * ser interrumpida por el servidor remoto (error 10054). Se utiliza el patrón Singleton
 * para garantizar UNA SOLA instancia a lo largo del proceso Node, evitando explosión
 * de conexiones. Ante una desconexión TLS, el cliente de Prisma maneja el reconnect
 * internamente en la siguiente invocación.
 */
const prismaClientSingleton = () => {
    return new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["error"] : [],
    });
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

// En desarrollo: persiste la instancia en globalThis para sobrevivir hot-reloads.
// En producción: cada worker tiene su propia instancia (comportamiento de Vercel/Next.js).
if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
