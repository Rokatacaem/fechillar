"use client";

import useSWR from 'swr';
import { getPublicTournamentData } from '@/app/(public)/torneos/actions';

/**
 * Hook para obtener datos del torneo en tiempo real.
 * @param tournamentId ID del torneo
 * @param refreshInterval Intervalo de refresco en milisegundos (10000 para TV, 20000 para Mobile)
 */
export function useTournamentLive(tournamentId: string, refreshInterval: number = 20000) {
    const { data, error, isLoading, mutate } = useSWR(
        tournamentId ? `tournament-live-${tournamentId}` : null,
        () => getPublicTournamentData(tournamentId),
        {
            refreshInterval,
            revalidateOnFocus: true,
            revalidateOnReconnect: true,
            dedupingInterval: 2000, // Evitar ráfagas accidentales
        }
    );

    return {
        data: data?.success ? data : null,
        error: error || (data?.success === false ? data.error : null),
        isLoading,
        refresh: mutate
    };
}
