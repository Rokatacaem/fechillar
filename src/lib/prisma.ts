import { PrismaClient } from "@prisma/client";

import { auth } from "@/auth";

const prismaClientSingleton = () => {
  const baseClient = new PrismaClient();
  
  return baseClient.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // 1. Modelos que requieren aislamiento estricto por tenantId
          const protectedModels = [
            "PlayerProfile",
            "Tournament",
            "FinanceRecord",
            "TournamentRegistration",
            "Ranking",
            "Match" // Dependiente de Tournament, pero si tiene tenantId, mejor filtrar
          ];

          if (protectedModels.includes(model)) {
            try {
              // 2. Intentar obtener el contexto de tenant desde la sesión
              // auth() puede fallar si faltan variables de entorno como AUTH_SECRET
              const session = await auth();
              const tenantId = (session?.user as any)?.tenantId;
              const role = (session?.user as any)?.role;

              // 3. Aplicar aislamiento si no es admin de federación y tenemos un tenantId
              if (role !== "FEDERATION_ADMIN" && tenantId) {
                // Inyectar o combinar filtros where
                args.where = { 
                  ...args.where, 
                  tenantId: tenantId 
                };
              }
            } catch (authError) {
              // CRÍTICO: No dejar que un error de auth bloquee la DB, pero alertar.
              console.error(`[PRISMA_ISOLATION_ERROR] Fallo al obtener sesión para ${model}:`, authError);
            }
          }

          return query(args);
        },
      },
    },
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
