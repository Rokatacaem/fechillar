import { redirect } from "next/navigation";

export default function AjustePage({ params }: { params: { id: string } }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-4">Fase de Ajuste</h1>
      <p className="text-slate-400">
        Esta fase se habilitará cuando todos los grupos estén completos.
      </p>
      <p className="text-slate-400 mt-2">
        Los 4 jugadores clasificados jugarán 2 partidas para definir quiénes 
        avanzan a octavos de final.
      </p>
    </div>
  );
}
