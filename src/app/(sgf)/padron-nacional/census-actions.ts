"use server";

import prisma from "@/lib/prisma";

export async function getClubs() {
  return prisma.club.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

/**
 * Obtiene el padrón completo de jugadores federados con sus rankings
 * y estado de membresía (vía User → Membership)
 */
export async function getFederatedCensus() {
  try {
    const players = await prisma.playerProfile.findMany({
      include: {
        club: true,
        user: {
          include: {
            memberships: {
              where: { type: "ANNUAL" },
              orderBy: { validUntil: "desc" },
              take: 1
            }
          }
        },
        rankings: {
          where: {
            discipline: {
              in: ['THREE_BAND', 'THREE_BAND_ANNUAL']
            }
          }
        }
      },
      orderBy: [
        { lastName: "asc" },
        { firstName: "asc" }
      ]
    });

    return players;
  } catch (error) {
    console.error("Error fetching federated census:", error);
    throw error;
  }
}
