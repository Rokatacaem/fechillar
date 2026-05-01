"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

/**
 * Actualiza el ranking de un jugador (solo SUPERADMIN o FEDERATION_ADMIN)
 */
export async function updatePlayerRanking(
  playerId: string,
  discipline: string,
  category: string,
  data: {
    points?: number;
    average?: number;
    handicapTarget?: number;
    rankPosition?: number;
  }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("No autorizado");
  }

  // Verificar permisos (solo SUPERADMIN o FEDERATION_ADMIN)
  const allowedRoles = ['SUPERADMIN', 'FEDERATION_ADMIN'];
  if (!allowedRoles.includes((session?.user as any)?.role || '')) {
    throw new Error("No tienes permisos para editar rankings");
  }

  try {
    // Buscar o crear el ranking
    const ranking = await prisma.ranking.upsert({
      where: {
        playerId_discipline_category: {
          playerId,
          discipline: discipline as any,
          category: category as any
        }
      },
      update: {
        points: data.points,
        average: data.average,
        handicapTarget: data.handicapTarget,
        rankPosition: data.rankPosition,
        updatedAt: new Date()
      },
      create: {
        playerId,
        discipline: discipline as any,
        category: category as any,
        points: data.points || 0,
        average: data.average || 0,
        handicapTarget: data.handicapTarget || 15,
        rankPosition: data.rankPosition || 999
      }
    });

    // Crear snapshot histórico
    await prisma.rankingSnapshot.create({
      data: {
        playerId,
        discipline: discipline as any,
        category: category as any,
        points: ranking.points,
        rankPosition: ranking.rankPosition || 999,
        average: ranking.average || 0,
        snapshotDate: new Date()
      }
    });

    revalidatePath('/padron-nacional');
    revalidatePath('/tournaments');

    return { 
      success: true, 
      ranking,
      message: 'Ranking actualizado exitosamente' 
    };

  } catch (error: any) {
    console.error("Error updating ranking:", error);
    return { 
      success: false, 
      error: error.message || "Error al actualizar ranking" 
    };
  }
}

/**
 * Actualización masiva de rankings desde un array
 */
export async function bulkUpdateRankings(
  rankings: Array<{
    playerId: string;
    discipline: string;
    category: string;
    points: number;
    average: number;
    handicapTarget?: number;
    rankPosition: number;
  }>
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("No autorizado");
  }

  const allowedRoles = ['SUPERADMIN', 'FEDERATION_ADMIN'];
  if (!allowedRoles.includes((session?.user as any)?.role || '')) {
    throw new Error("No tienes permisos para editar rankings");
  }

  try {
    const results = [];
    
    for (const rankingData of rankings) {
      const result = await updatePlayerRanking(
        rankingData.playerId,
        rankingData.discipline,
        rankingData.category,
        {
          points: rankingData.points,
          average: rankingData.average,
          handicapTarget: rankingData.handicapTarget,
          rankPosition: rankingData.rankPosition
        }
      );
      results.push(result);
    }

    return { 
      success: true, 
      updated: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      message: `${results.filter(r => r.success).length} rankings actualizados`
    };

  } catch (error: any) {
    console.error("Error bulk updating rankings:", error);
    return { 
      success: false, 
      error: error.message || "Error en actualización masiva" 
    };
  }
}
