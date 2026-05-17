"use client";

import { useMemo, useState, useEffect } from "react";
import type { TournamentBracket, BracketMatch } from "@/lib/billiards/bracket-automation";
import { advanceMatch } from "@/app/(sgf)/tournaments/[id]/bracket/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil } from "lucide-react";

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────

interface PlayerMap {
  [playerId: string]: { name: string; photoUrl?: string };
}

interface BracketViewerProps {
  bracket: TournamentBracket;
  playerMap: PlayerMap;
  activeMatchId?: string;
  onMatchClick?: (match: BracketMatch) => void;
}

interface FormData {
  homeScore: string;
  awayScore: string;
  homeInnings: string;
  awayInnings: string;
  homeHighRun: string;
  awayHighRun: string;
  winnerId: string;
}

const EMPTY_FORM: FormData = {
  homeScore: "",
  awayScore: "",
  homeInnings: "",
  awayInnings: "",
  homeHighRun: "",
  awayHighRun: "",
  winnerId: "",
};

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────

export function BracketViewer({ bracket, playerMap, activeMatchId, onMatchClick }: BracketViewerProps) {
  const [selectedMatch, setSelectedMatch] = useState<BracketMatch | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [error, setError] = useState("");

  // Pre-llenar el formulario con valores existentes al abrir un partido ya jugado
  useEffect(() => {
    if (!selectedMatch) return;
    // Buscar la partida original en el bracket para obtener los scores
    const m = bracket.matches.find(bm => bm.id === selectedMatch.id);
    if (!m) return;

    // Los datos de score están en la partida de Prisma pasada via bracket.matches
    // El bracket reconstruido desde matchesToBracket no incluye scores, así que
    // inicializamos vacío — el admin corrige los valores desde cero si necesita editar.
    setFormData(prev => ({
      ...EMPTY_FORM,
      winnerId: m.winnerId ?? "",
    }));
    setError("");
  }, [selectedMatch]);

  // Auto-seleccionar ganador cuando los scores difieren
  useEffect(() => {
    if (!selectedMatch) return;
    const h = Number(formData.homeScore);
    const a = Number(formData.awayScore);
    if (formData.homeScore === "" || formData.awayScore === "") return;
    if (h > a) setFormData(prev => ({ ...prev, winnerId: selectedMatch.homePlayerId ?? "" }));
    else if (a > h) setFormData(prev => ({ ...prev, winnerId: selectedMatch.awayPlayerId ?? "" }));
    else setFormData(prev => ({ ...prev, winnerId: "" })); // empate → requiere selección manual
  }, [formData.homeScore, formData.awayScore]);

  const handleMatchClick = (match: BracketMatch) => {
    // Permitir edición si tiene al menos uno de los dos jugadores asignados
    if (match.homePlayerId || match.awayPlayerId) {
      setSelectedMatch(match);
    }
    if (onMatchClick) onMatchClick(match);
  };

  const handleSaveResult = async () => {
    if (!selectedMatch?.homePlayerId || !selectedMatch?.awayPlayerId) {
      setError("La partida aún no tiene ambos jugadores asignados.");
      return;
    }
    if (!formData.winnerId) {
      setError("Debes seleccionar el ganador.");
      return;
    }
    if (formData.homeScore === "" || formData.awayScore === "") {
      setError("Ingresa las carambolas de ambos jugadores.");
      return;
    }

    setError("");
    try {
      setIsLoading(true);
      await advanceMatch({
        matchId: selectedMatch.id,
        winnerId: formData.winnerId,
        homeScore: Number(formData.homeScore),
        awayScore: Number(formData.awayScore),
        homeInnings: Number(formData.homeInnings) || 0,
        awayInnings: Number(formData.awayInnings) || 0,
        homeHighRun: Number(formData.homeHighRun) || 0,
        awayHighRun: Number(formData.awayHighRun) || 0,
      });
      setSelectedMatch(null);
    } catch (err: any) {
      setError("Error al guardar: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const homeName = selectedMatch?.homePlayerId ? playerMap[selectedMatch.homePlayerId]?.name ?? "Jugador 1" : "Por definir";
  const awayName = selectedMatch?.awayPlayerId ? playerMap[selectedMatch.awayPlayerId]?.name ?? "Jugador 2" : "Por definir";

  const isCompleted = !!(selectedMatch?.winnerId);

  return (
    <div className="w-full overflow-x-auto bg-[#1a202c] p-8 rounded-xl shadow-2xl custom-scrollbar min-h-[700px] flex items-center justify-center">
      <SymmetricBracket
        bracket={bracket}
        players={playerMap}
        activeMatchId={activeMatchId}
        onMatchClick={handleMatchClick}
      />

      {/* ── Modal de resultado ─────────────────────────────── */}
      <Dialog open={!!selectedMatch} onOpenChange={(open) => !open && setSelectedMatch(null)}>
        <DialogContent className="bg-[#1a202c] border-[#4a5568] text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#facc15] flex items-center gap-2">
              <Pencil className="w-4 h-4" />
              {isCompleted ? "Editar Resultado" : "Ingresar Resultado"}
            </DialogTitle>
          </DialogHeader>

          {selectedMatch && (
            <div className="space-y-5 pt-2">
              {/* ── Tabla de scores ── */}
              <div className="grid grid-cols-2 gap-4">
                {/* Jugador Home */}
                <div className="space-y-3">
                  <div className="font-bold text-center py-2 bg-[#2d3748] rounded-lg text-sm truncate px-2">
                    {homeName}
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Carambolas</label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={formData.homeScore}
                      onChange={e => setFormData(prev => ({ ...prev, homeScore: e.target.value }))}
                      className="bg-[#2d3748] border-[#4a5568] text-white mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Entradas</label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={formData.homeInnings}
                      onChange={e => setFormData(prev => ({ ...prev, homeInnings: e.target.value }))}
                      className="bg-[#2d3748] border-[#4a5568] text-white mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Serie Mayor</label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={formData.homeHighRun}
                      onChange={e => setFormData(prev => ({ ...prev, homeHighRun: e.target.value }))}
                      className="bg-[#2d3748] border-[#4a5568] text-white mt-1"
                    />
                  </div>
                </div>

                {/* Jugador Away */}
                <div className="space-y-3">
                  <div className="font-bold text-center py-2 bg-[#2d3748] rounded-lg text-sm truncate px-2">
                    {awayName}
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Carambolas</label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={formData.awayScore}
                      onChange={e => setFormData(prev => ({ ...prev, awayScore: e.target.value }))}
                      className="bg-[#2d3748] border-[#4a5568] text-white mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Entradas</label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={formData.awayInnings}
                      onChange={e => setFormData(prev => ({ ...prev, awayInnings: e.target.value }))}
                      className="bg-[#2d3748] border-[#4a5568] text-white mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Serie Mayor</label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={formData.awayHighRun}
                      onChange={e => setFormData(prev => ({ ...prev, awayHighRun: e.target.value }))}
                      className="bg-[#2d3748] border-[#4a5568] text-white mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* ── Selector de ganador ── */}
              <div className="pt-2 border-t border-[#4a5568]">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-3">
                  Ganador
                  {formData.homeScore !== "" && formData.awayScore !== "" &&
                   Number(formData.homeScore) === Number(formData.awayScore) &&
                    <span className="ml-2 text-amber-400 normal-case">— Empate en carambolas, selecciona por arrime</span>
                  }
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, winnerId: selectedMatch.homePlayerId ?? "" }))}
                    className={`py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all truncate ${
                      formData.winnerId === selectedMatch.homePlayerId
                        ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                        : "border-[#4a5568] bg-[#2d3748] text-gray-400 hover:border-[#718096]"
                    }`}
                  >
                    {homeName.split(" ")[0]} {homeName.split(" ").slice(-1)[0]}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, winnerId: selectedMatch.awayPlayerId ?? "" }))}
                    className={`py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all truncate ${
                      formData.winnerId === selectedMatch.awayPlayerId
                        ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                        : "border-[#4a5568] bg-[#2d3748] text-gray-400 hover:border-[#718096]"
                    }`}
                  >
                    {awayName.split(" ")[0]} {awayName.split(" ").slice(-1)[0]}
                  </button>
                </div>
              </div>

              {/* ── Error ── */}
              {error && (
                <p className="text-rose-400 text-xs font-bold bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-2">
                  {error}
                </p>
              )}

              {/* ── Acciones ── */}
              <div className="flex justify-end gap-3 pt-2 border-t border-[#4a5568]">
                <Button
                  variant="outline"
                  onClick={() => setSelectedMatch(null)}
                  className="border-[#4a5568] text-gray-400 hover:text-white bg-transparent"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveResult}
                  disabled={isLoading || !formData.winnerId || formData.homeScore === "" || formData.awayScore === ""}
                  className="bg-[#facc15] hover:bg-[#fbbf24] text-black font-bold"
                >
                  {isLoading ? "Guardando..." : isCompleted ? "Actualizar Resultado" : "Guardar Resultado"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────────────────────
// ÁRBOL SIMÉTRICO
// ─────────────────────────────────────────────

interface SymmetricBracketProps {
  bracket: TournamentBracket;
  players: PlayerMap;
  activeMatchId?: string;
  onMatchClick?: (match: BracketMatch) => void;
}

function SymmetricBracket({ bracket, players, activeMatchId, onMatchClick }: SymmetricBracketProps) {
  const { matches, rounds } = bracket;

  const matchesByRound = useMemo(() => {
    const map: Record<number, BracketMatch[]> = {};
    for (let r = 1; r <= rounds; r++) {
      map[r] = matches.filter(m => m.round === r).sort((a, b) => a.position - b.position);
    }
    return map;
  }, [matches, rounds]);

  if (rounds <= 1) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h3 className="text-[#facc15] font-bold text-xl mb-6">FINAL</h3>
        {matchesByRound[1]?.map(match => (
          <MatchBox key={match.id} match={match} players={players} isActive={activeMatchId === match.id} onClick={() => onMatchClick?.(match)} isCenter />
        ))}
      </div>
    );
  }

  const leftColumns = [];
  const rightColumns = [];

  for (let r = 1; r < rounds; r++) {
    const roundMatches = matchesByRound[r] || [];
    const half = Math.ceil(roundMatches.length / 2);
    leftColumns.push({ round: r, matches: roundMatches.slice(0, half) });
    rightColumns.push({ round: r, matches: roundMatches.slice(half) });
  }

  const finalMatch = matchesByRound[rounds]?.[0];

  const getRoundName = (r: number) => {
    const fromFinal = rounds - r;
    if (fromFinal === 1) return "Semifinal";
    if (fromFinal === 2) return "Cuartos de Final";
    if (fromFinal === 3) return "Octavos de Final";
    if (fromFinal === 4) return "16avos de Final";
    return `Ronda ${r}`;
  };

  return (
    <div className="flex flex-row items-stretch justify-center w-max min-w-full gap-2">
      {/* LADO IZQUIERDO */}
      <div className="flex flex-row gap-6">
        {leftColumns.map(col => (
          <div key={`left-r${col.round}`} className="flex flex-col justify-around relative">
            <h4 className="absolute -top-8 w-full text-center text-[#facc15] text-sm font-semibold uppercase tracking-wide">
              {getRoundName(col.round)}
            </h4>
            {col.matches.map(match => (
              <div key={match.id} className="py-2 relative flex items-center">
                <MatchBox match={match} players={players} isActive={activeMatchId === match.id} onClick={() => onMatchClick?.(match)} />
                {col.round < rounds - 1 && <div className="absolute -right-6 w-6 border-b-2 border-[#facc15] top-1/2" />}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* CENTRO (FINAL) */}
      <div className="flex flex-col items-center justify-center px-8 relative min-w-[280px]">
        {finalMatch && (
          <>
            <h3 className="text-[#facc15] font-bold text-2xl mb-4 tracking-widest uppercase shadow-black drop-shadow-md">Final</h3>
            <div className="relative">
              <div className="absolute -left-8 w-8 border-b-2 border-[#facc15] top-1/2" />
              <div className="absolute -right-8 w-8 border-b-2 border-[#facc15] top-1/2" />
              <MatchBox match={finalMatch} players={players} isActive={activeMatchId === finalMatch.id} onClick={() => onMatchClick?.(finalMatch)} isCenter />
            </div>
            <div className="mt-8 flex flex-col items-center">
              <h4 className="text-[#facc15] font-bold text-lg mb-2 uppercase tracking-wider">Campeón</h4>
              <div className="w-56 h-12 bg-[#2d3748] border-2 border-[#facc15] rounded-md flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.3)]">
                <span className="text-white font-bold text-lg truncate px-4">
                  {finalMatch.winnerId ? players[finalMatch.winnerId]?.name : "Por definir"}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* LADO DERECHO */}
      <div className="flex flex-row-reverse gap-6">
        {rightColumns.map(col => (
          <div key={`right-r${col.round}`} className="flex flex-col justify-around relative">
            <h4 className="absolute -top-8 w-full text-center text-[#facc15] text-sm font-semibold uppercase tracking-wide">
              {getRoundName(col.round)}
            </h4>
            {col.matches.map(match => (
              <div key={match.id} className="py-2 relative flex items-center justify-end">
                {col.round < rounds - 1 && <div className="absolute -left-6 w-6 border-b-2 border-[#facc15] top-1/2" />}
                <MatchBox match={match} players={players} isActive={activeMatchId === match.id} onClick={() => onMatchClick?.(match)} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MATCH BOX
// ─────────────────────────────────────────────

interface MatchBoxProps {
  match: BracketMatch;
  players: PlayerMap;
  isActive?: boolean;
  onClick?: () => void;
  isCenter?: boolean;
}

function MatchBox({ match, players, isActive, onClick, isCenter }: MatchBoxProps) {
  const homePlayer = match.homePlayerId ? players[match.homePlayerId] : null;
  const awayPlayer = match.awayPlayerId ? players[match.awayPlayerId] : null;

  const isHomeWinner = match.winnerId === match.homePlayerId;
  const isAwayWinner = match.winnerId === match.awayPlayerId;
  const isCompleted = !!match.winnerId || match.isBye;

  // Editable si tiene al menos un jugador
  const isClickable = !!(onClick && (match.homePlayerId || match.awayPlayerId));

  const formatName = (name: string) => {
    const parts = name.split(" ");
    return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : name;
  };

  const renderSlot = (
    playerId: string | null,
    isWinner: boolean,
    playerDetails: { name: string } | null,
    position: "top" | "bottom"
  ) => {
    const bgClass = isWinner ? "bg-[#3182ce]/40" : "bg-[#2d3748]";
    const textClass = isWinner ? "text-white font-bold" : "text-gray-300";
    const borderClass = position === "top" ? "border-b border-[#1a202c]" : "";

    return (
      <div className={`flex items-center h-8 ${bgClass} ${borderClass} w-full`}>
        <div className={`flex-1 px-3 truncate text-sm ${textClass} ${!playerId ? "italic opacity-50" : ""}`}>
          {playerId ? formatName(playerDetails?.name ?? "?") : "..."}
        </div>
        <div className={`w-8 h-full flex items-center justify-center border-l border-[#1a202c] ${isWinner ? "bg-[#3182ce]" : "bg-[#4a5568]"}`}>
          <span className="text-white text-xs font-bold">{isWinner ? "W" : "-"}</span>
        </div>
      </div>
    );
  };

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={`
        w-48 flex flex-col rounded overflow-hidden shadow-lg border transition-all z-10 relative
        ${isClickable ? "cursor-pointer hover:border-[#facc15] hover:shadow-[#facc15]/20" : "cursor-default"}
        ${isActive ? "border-[#facc15] shadow-[#facc15]/30 shadow-md scale-105" : "border-[#4a5568]"}
        ${isCenter ? "w-56 scale-110 mb-4" : ""}
      `}
    >
      {renderSlot(match.homePlayerId, isHomeWinner, homePlayer, "top")}
      {renderSlot(match.awayPlayerId, isAwayWinner, awayPlayer, "bottom")}
      {/* Indicador de editable */}
      {isCompleted && isClickable && (
        <div className="absolute top-0.5 right-9 opacity-30 hover:opacity-60 transition-opacity">
          <Pencil className="w-2.5 h-2.5 text-[#facc15]" />
        </div>
      )}
    </div>
  );
}
