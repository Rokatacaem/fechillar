"use client";

import { useState, useEffect } from "react";
import { updatePlayerRanking } from "@/app/(sgf)/tournaments/ranking/actions";
import { toast } from "sonner";
import { Loader2, Save, X } from "lucide-react";

interface RankingEditorProps {
  player: {
    id: string;
    firstName: string;
    lastName: string;
    club?: { name: string };
    rankings?: Array<{
      discipline: string;
      points: number;
      average: number;
      handicapTarget: number | null;
      rankPosition: number | null;
    }>;
  };
  onClose?: () => void;
  onSuccess?: () => void;
}

export function RankingEditor({
  player,
  onClose,
  onSuccess
}: RankingEditorProps) {
  const [rankingType, setRankingType] = useState<'NATIONAL' | 'ANNUAL'>('NATIONAL');
  const [loading, setLoading] = useState(false);
  
  // Buscar rankings existentes
  const nationalRanking = player.rankings?.find(r => r.discipline === 'THREE_BAND');
  const annualRanking = player.rankings?.find(r => r.discipline === 'THREE_BAND_ANNUAL');
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    points: 0,
    average: 0,
    handicapTarget: 15,
    rankPosition: 999
  });

  // Actualizar formulario cuando cambia el tipo de ranking
  useEffect(() => {
    const activeRanking = rankingType === 'NATIONAL' ? nationalRanking : annualRanking;
    if (activeRanking) {
      setFormData({
        points: activeRanking.points || 0,
        average: activeRanking.average || 0,
        handicapTarget: activeRanking.handicapTarget || 15,
        rankPosition: activeRanking.rankPosition || 999
      });
    } else {
      // Si no existe, valores por defecto
      setFormData({
        points: 0,
        average: 0,
        handicapTarget: rankingType === 'NATIONAL' ? 15 : 0,
        rankPosition: 999
      });
    }
  }, [rankingType, nationalRanking, annualRanking]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const discipline = rankingType === 'NATIONAL' ? 'THREE_BAND' : 'THREE_BAND_ANNUAL';
      
      const result = await updatePlayerRanking(
        player.id,
        discipline,
        'MASTER',
        {
          points: formData.points,
          average: formData.average,
          handicapTarget: rankingType === 'NATIONAL' ? formData.handicapTarget : null,
          rankPosition: formData.rankPosition
        }
      );

      if (result.success) {
        toast.success("Ranking actualizado", {
          description: `${player.firstName} ${player.lastName} - ${rankingType === 'NATIONAL' ? 'Nacional' : 'Anual'}: ${formData.average.toFixed(3)}`
        });
        onSuccess?.();
        onClose?.();
      } else {
        toast.error("Error", {
          description: result.error || "No se pudo actualizar el ranking"
        });
      }
    } catch (error) {
      toast.error("Error inesperado al actualizar ranking");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">
              Editar Ranking
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              {player.firstName} {player.lastName}
            </p>
            {player.club && (
              <p className="text-xs text-slate-500">{player.club.name}</p>
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tabs de Tipo de Ranking */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setRankingType('NATIONAL')}
            className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all ${
              rankingType === 'NATIONAL'
                ? 'bg-emerald-600 text-slate-950'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Nacional
            <span className="block text-xs font-normal mt-0.5">
              Con Handicap
            </span>
          </button>
          <button
            type="button"
            onClick={() => setRankingType('ANNUAL')}
            className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all ${
              rankingType === 'ANNUAL'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Anual
            <span className="block text-xs font-normal mt-0.5">
              Sin Handicap
            </span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Puntos */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Puntos
            </label>
            <input
              type="number"
              value={formData.points}
              onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-emerald-500/50"
              min="0"
              required
            />
          </div>

          {/* Promedio */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Promedio (PGP)
            </label>
            <input
              type="number"
              step="0.001"
              value={formData.average}
              onChange={(e) => setFormData({ ...formData, average: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-emerald-500/50"
              min="0"
              max="10"
              required
            />
          </div>

          {/* Handicap Target - SOLO para Ranking Nacional */}
          {rankingType === 'NATIONAL' && (
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Handicap Target
              </label>
              <input
                type="number"
                value={formData.handicapTarget}
                onChange={(e) => setFormData({ ...formData, handicapTarget: parseInt(e.target.value) || 15 })}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-emerald-500/50"
                min="10"
                max="30"
                required
              />
            </div>
          )}

          {/* Posición en Ranking */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Posición en Ranking
            </label>
            <input
              type="number"
              value={formData.rankPosition}
              onChange={(e) => setFormData({ ...formData, rankPosition: parseInt(e.target.value) || 999 })}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-emerald-500/50"
              min="1"
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold transition-all"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Guardar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
