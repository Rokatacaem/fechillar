import { Metadata } from "next";
import { getPublicTournamentData } from "../actions";
import { TournamentLiveView } from "@/components/tournaments/TournamentLiveView";
import { notFound } from "next/navigation";

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const res = await getPublicTournamentData(id);
    if (!res.success || !res.tournament) return { title: "Torneo no encontrado" };

    // ✅ FIX APLICADO: Uso de ?. y fallback || ""
    return {
        title: `${res.tournament?.name || 'Torneo'} | Live Center Fechillar`,
        description: `Sigue en vivo los resultados y cuadros del torneo ${res.tournament?.name || 'en curso'}.`
    };
}

export default async function PublicTournamentPage({ params }: Props) {
    const { id } = await params;
    const res = await getPublicTournamentData(id);

    if (!res.success || !res.tournament) return notFound();

    return <TournamentLiveView tournamentId={id} />;
}