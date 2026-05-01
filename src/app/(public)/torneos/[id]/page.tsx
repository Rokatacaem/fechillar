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
    if (!res.success) return { title: "Torneo no encontrado" };
    return {
        title: `${res.tournament.name} | Live Center Fechillar`,
        description: `Sigue en vivo los resultados y cuadros del torneo ${res.tournament.name}.`
    };
}

export default async function PublicTournamentPage({ params }: Props) {
    const { id } = await params;
    const res = await getPublicTournamentData(id);

    if (!res.success) return notFound();

    return <TournamentLiveView tournamentId={id} />;
}
