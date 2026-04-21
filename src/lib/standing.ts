import prisma from "@/lib/prisma";
import { MembershipStatus } from "@prisma/client";
import { addDays, isBefore } from "date-fns";

export type StandingColor = "emerald-500" | "amber-500" | "rose-600";
export type StandingStatus = "GREEN" | "AMBER" | "RED";

export interface PlayerStanding {
    color: StandingColor;
    status: StandingStatus;
    message: string;
    validUntil?: Date;
}

/**
 * Calcula el 'Semáforo de Pagos' de un jugador (Padrón Federado).
 * 
 * @param userId ID del usuario
 * @param prefetchedMembership (Opcional) Membresía ya cargada. 
 *                             Si se pasa explicitly como undefined, se asume que NO EXISTE membresía.
 */
export async function getPlayerStanding(userId: string, prefetchedMembership?: any): Promise<PlayerStanding> {
    
    // Si prefetchedMembership es undefined pero NO se pasó el argumento, buscamos.
    // Si se pasó como null o se incluyó en la llamada, evitamos el query.
    let membership = prefetchedMembership;
    
    // Solo hacemos query si no se nos pasó nada (argument length check o similar no es posible aquí fácilmente,
    // así que dependemos de que el llamador pase null si quiere indicar 'no existe').
    if (membership === undefined && arguments.length === 1) {
        if (!userId) {
            membership = null;
        } else {
            membership = await prisma.membership.findFirst({
                where: { userId },
                orderBy: { validUntil: "desc" }
            });
        }
    }

    if (!membership) {
        return {
            color: "rose-600",
            status: "RED",
            message: "Sin membresía federada registrada."
        };
    }

    const now = new Date();
    const amberThreshold = addDays(now, 15);

    // 1. Bloqueo si no está validado
    if (membership.status !== MembershipStatus.PAID || !membership.validatedAt) {
        return {
            color: "rose-600",
            status: "RED",
            message: "Membresía pendiente de validación.",
            validUntil: membership.validUntil
        };
    }

    // 2. Bloqueo Inmediato por Vencimiento
    if (isBefore(membership.validUntil, now)) {
        return {
            color: "rose-600",
            status: "RED",
            message: "Membresía VENCIDA. Bloqueo de competencia.",
            validUntil: membership.validUntil
        };
    }

    // 3. Estado Ámbar (Regla de los 15 días)
    if (isBefore(membership.validUntil, amberThreshold)) {
        return {
            color: "amber-500",
            status: "AMBER",
            message: "Próximo a vencer (Alerta 15 días). Renovar pronto.",
            validUntil: membership.validUntil
        };
    }

    // 4. Estado Verde (Todo OK)
    return {
        color: "emerald-500",
        status: "GREEN",
        message: "Padrón al día. Habilitado para competir.",
        validUntil: membership.validUntil
    };
}
