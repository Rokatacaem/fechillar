import MatchRefereeBoard from "@/components/referee/MatchRefereeBoard";
import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const metadata: Metadata = {
  title: "Referee Tactical Board",
};

export default async function RefereeMatchPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const matchId = params.id;
  
  // 1. Session Auth Extraction
  const session = await auth();
  if (!session?.user) {
      redirect("/login");
  }

  const user = session.user as any;
  const role = user.role || "USER";

  // 2. Fetch Match from DB to get refereeId and player photos
  const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
          homePlayer: { include: { user: true } },
          awayPlayer: { include: { user: true } },
          phase: true
      }
  });

  if (!match) {
      return (
          <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
              <h1 className="text-4xl font-bold text-rose-500 mb-4">404 - Partido No Encontrado</h1>
              <p className="text-slate-400">El partido solicitado no existe o fue eliminado.</p>
          </div>
      );
  }

  // 3. Security Blindness: Match Authentication by Identity
  // Acceso autorizado SOLO si es un SuperAdmin/Admin, O si es el Juez asignado específicamente
  if (role !== "ADMIN" && role !== "SUPERADMIN" && role !== "FEDERATION_ADMIN" && user.id !== match.refereeId) {
       return (
           <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
               <div className="bg-rose-950/20 border border-rose-900/50 p-8 rounded-3xl max-w-lg">
                   <div className="w-20 h-20 bg-rose-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
                       <span className="text-4xl">🛑</span>
                   </div>
                   <h1 className="text-3xl font-black text-rose-500 mb-2">Acceso No Autorizado</h1>
                   <p className="text-slate-300 font-medium tracking-wide">
                        Transparencia Deportiva: No estás asignado como el Juez Oficial de esta mesa.
                   </p>
                   <p className="text-slate-500 text-sm mt-4">
                        Por integridad auditada, solo el juez titular o el comité técnico puede manipular este teclado.
                   </p>
                   <a href="/dashboard" className="mt-8 inline-block bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-8 rounded-full transition-colors">
                        Volver a Central
                   </a>
               </div>
           </div>
       );
  }

  return (
    <main className="min-h-screen bg-slate-950 font-sans selection:bg-emerald-500/30">
      <MatchRefereeBoard matchId={matchId} initialData={match} />
    </main>
  );
}
