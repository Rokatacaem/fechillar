"use client";

import { useMemo, useState } from "react";
import type { TournamentBracket, BracketMatch } from "@/lib/billiards/bracket-automation";
import { advanceMatch } from "@/app/(sgf)/tournaments/[id]/bracket/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ─────────────────────────────────────────────
// TIPOS DE PROPS
// ─────────────────────────────────────────────

interface PlayerMap {
  [playerId: string]: {
    name: string;
    photoUrl?: string;
  };
}

interface BracketViewerProps {
  bracket: TournamentBracket;
  playerMap: PlayerMap;
  activeMatchId?: string;
  onMatchClick?: (match: BracketMatch) => void;
}

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────

export function BracketViewer({
  bracket,
  playerMap,
  activeMatchId,
  onMatchClick,
}: BracketViewerProps) {
  const [selectedMatch, setSelectedMatch] = useState<BracketMatch | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    homeScore: "",
    awayScore: "",
    homeInnings: "",
    awayInnings: "",
  });

  const handleMatchClick = (match: BracketMatch) => {
    // Solo permitir edición si el match está PENDING y tiene ambos jugadores
    if (match.status === "PENDING" && match.homePlayerId && match.awayPlayerId) {
      setSelectedMatch(match);
      setFormData({ homeScore: "", awayScore: "", homeInnings: "", awayInnings: "" });
    }
    if (onMatchClick) onMatchClick(match);
  };

  const handleSaveResult = async () => {
    if (!selectedMatch || !selectedMatch.homePlayerId || !selectedMatch.awayPlayerId) return;
    
    const hScore = Number(formData.homeScore);
    const aScore = Number(formData.awayScore);
    
    let winnerId = "";
    if (hScore > aScore) winnerId = selectedMatch.homePlayerId;
    else if (aScore > hScore) winnerId = selectedMatch.awayPlayerId;
    else return alert("No puede haber empate en etapa eliminatoria.");

    try {
      setIsLoading(true);
      await advanceMatch({
        matchId: selectedMatch.id,
        winnerId,
        homeScore: hScore,
        awayScore: aScore,
        homeInnings: Number(formData.homeInnings) || 0,
        awayInnings: Number(formData.awayInnings) || 0,
      });
      setSelectedMatch(null);
    } catch (error: any) {
      alert("Error al guardar: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const isModalOpen = !!selectedMatch;

  return (
    <div className="w-full overflow-x-auto bg-[#1a202c] p-8 rounded-xl shadow-2xl custom-scrollbar min-h-[700px] flex items-center justify-center">
      <SymmetricBracket
        bracket={bracket}
        players={playerMap}
        activeMatchId={activeMatchId}
        onMatchClick={handleMatchClick}
      />

      {/* Modal para ingresar resultados */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && setSelectedMatch(null)}>
        <DialogContent className="bg-[#1a202c] border-[#4a5568] text-white">
          <DialogHeader>
            <DialogTitle className="text-[#facc15]">Ingresar Resultado</DialogTitle>
          </DialogHeader>
          
          {selectedMatch && selectedMatch.homePlayerId && selectedMatch.awayPlayerId && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-8">
                {/* Jugador Home */}
                <div className="space-y-3">
                  <div className="font-bold text-center h-12 flex items-center justify-center bg-[#2d3748] rounded">
                    {playerMap[selectedMatch.homePlayerId]?.name}
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Puntaje (Carambolas)</label>
                    <Input 
                      type="number" 
                      value={formData.homeScore} 
                      onChange={e => setFormData({...formData, homeScore: e.target.value})}
                      className="bg-[#2d3748] border-[#4a5568]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Entradas</label>
                    <Input 
                      type="number" 
                      value={formData.homeInnings} 
                      onChange={e => setFormData({...formData, homeInnings: e.target.value})}
                      className="bg-[#2d3748] border-[#4a5568]"
                    />
                  </div>
                </div>

                {/* Jugador Away */}
                <div className="space-y-3">
                  <div className="font-bold text-center h-12 flex items-center justify-center bg-[#2d3748] rounded">
                    {playerMap[selectedMatch.awayPlayerId]?.name}
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Puntaje (Carambolas)</label>
                    <Input 
                      type="number" 
                      value={formData.awayScore} 
                      onChange={e => setFormData({...formData, awayScore: e.target.value})}
                      className="bg-[#2d3748] border-[#4a5568]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Entradas</label>
                    <Input 
                      type="number" 
                      value={formData.awayInnings} 
                      onChange={e => setFormData({...formData, awayInnings: e.target.value})}
                      className="bg-[#2d3748] border-[#4a5568]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-[#4a5568]">
                <Button 
                  onClick={handleSaveResult} 
                  disabled={isLoading || !formData.homeScore || !formData.awayScore}
                  className="bg-[#3182ce] hover:bg-[#2b6cb0] text-white font-bold"
                >
                  {isLoading ? "Guardando..." : "Guardar Resultado"}
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

function SymmetricBracket({
  bracket,
  players,
  activeMatchId,
  onMatchClick,
}: SymmetricBracketProps) {
  const { matches, rounds } = bracket;

  const matchesByRound = useMemo(() => {
    const map: Record<number, BracketMatch[]> = {};
    for (let r = 1; r <= rounds; r++) {
      map[r] = matches
        .filter((m) => m.round === r)
        .sort((a, b) => a.position - b.position);
    }
    return map;
  }, [matches, rounds]);

  // Si solo hay final (2 jugadores) o no hay matches
  if (rounds <= 1) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h3 className="text-[#facc15] font-bold text-xl mb-6">FINAL</h3>
        {matchesByRound[1]?.map((match) => (
          <MatchBox
            key={match.id}
            match={match}
            players={players}
            isActive={activeMatchId === match.id}
            onClick={() => onMatchClick?.(match)}
            isCenter
          />
        ))}
      </div>
    );
  }

  // Columnas para el lado izquierdo y derecho (excluyendo la final)
  const leftColumns = [];
  const rightColumns = [];

  for (let r = 1; r < rounds; r++) {
    const roundMatches = matchesByRound[r] || [];
    const half = Math.ceil(roundMatches.length / 2);
    const leftSide = roundMatches.slice(0, half);
    const rightSide = roundMatches.slice(half);

    leftColumns.push({ round: r, matches: leftSide });
    rightColumns.push({ round: r, matches: rightSide });
  }

  const finalMatch = matchesByRound[rounds]?.[0];

  const getRoundName = (r: number, isFinal: boolean) => {
    if (isFinal) return "Final";
    if (r === rounds - 1) return "Semifinal";
    if (r === rounds - 2) return "Cuartos de Final";
    if (r === rounds - 3) return "Octavos de Final";
    if (r === rounds - 4) return "16avos de Final";
    return `Ronda ${r}`;
  };

  return (
    <div className="flex flex-row items-stretch justify-center w-max min-w-full gap-2">
      {/* LADO IZQUIERDO */}
      <div className="flex flex-row gap-6">
        {leftColumns.map((col, idx) => (
          <div key={`left-r${col.round}`} className="flex flex-col justify-around relative">
            <h4 className="absolute -top-8 w-full text-center text-[#facc15] text-sm font-semibold uppercase tracking-wide">
              {getRoundName(col.round, false)}
            </h4>
            {col.matches.map((match) => (
              <div key={match.id} className="py-2 relative flex items-center">
                <MatchBox
                  match={match}
                  players={players}
                  isActive={activeMatchId === match.id}
                  onClick={() => onMatchClick?.(match)}
                />
                {/* Conector CSS hacia la derecha */}
                {col.round < rounds - 1 && (
                  <div className="absolute -right-6 w-6 border-b-2 border-[#facc15] top-1/2" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* CENTRO (FINAL) */}
      <div className="flex flex-col items-center justify-center px-8 relative min-w-[280px]">
        {finalMatch && (
          <>
            <h3 className="text-[#facc15] font-bold text-2xl mb-4 tracking-widest uppercase shadow-black drop-shadow-md">
              Final
            </h3>
            <div className="relative">
              {/* Conector desde la izquierda */}
              <div className="absolute -left-8 w-8 border-b-2 border-[#facc15] top-1/2" />
              {/* Conector desde la derecha */}
              <div className="absolute -right-8 w-8 border-b-2 border-[#facc15] top-1/2" />
              <MatchBox
                match={finalMatch}
                players={players}
                isActive={activeMatchId === finalMatch.id}
                onClick={() => onMatchClick?.(finalMatch)}
                isCenter
              />
            </div>
            
            {/* Campeón visual */}
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
        {rightColumns.map((col, idx) => (
          <div key={`right-r${col.round}`} className="flex flex-col justify-around relative">
            <h4 className="absolute -top-8 w-full text-center text-[#facc15] text-sm font-semibold uppercase tracking-wide">
              {getRoundName(col.round, false)}
            </h4>
            {col.matches.map((match) => (
              <div key={match.id} className="py-2 relative flex items-center justify-end">
                {/* Conector CSS hacia la izquierda */}
                {col.round < rounds - 1 && (
                  <div className="absolute -left-6 w-6 border-b-2 border-[#facc15] top-1/2" />
                )}
                <MatchBox
                  match={match}
                  players={players}
                  isActive={activeMatchId === match.id}
                  onClick={() => onMatchClick?.(match)}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// COMPONENTE DE CUADRO (MATCH BOX)
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
  
  const isClickable = onClick && match.status === "PENDING" && match.homePlayerId && match.awayPlayerId;

  // Lógica para formatear el nombre (apellido corto, etc. - opcional)
  const formatName = (name: string) => {
    const parts = name.split(" ");
    if (parts.length > 1) {
      return `${parts[0]} ${parts[parts.length - 1]}`;
    }
    return name;
  };

  const renderSlot = (playerId: string | null, isWinner: boolean, playerDetails: any, isBye: boolean, position: "top" | "bottom") => {
    const bgClass = isWinner ? "bg-[#3182ce]/40" : "bg-[#2d3748]";
    const textClass = isWinner ? "text-white font-bold" : "text-gray-300";
    const borderClass = position === "top" ? "border-b border-[#1a202c]" : "";

    return (
      <div className={`flex items-center h-8 ${bgClass} ${borderClass} w-full`}>
        {/* Nombre */}
        <div className={`flex-1 px-3 truncate text-sm ${textClass} ${!playerId && !isBye ? 'italic opacity-60' : ''}`}>
          {playerId ? formatName(playerDetails?.name) : (isBye ? "BYE" : "...")}
        </div>
        
        {/* Score box */}
        <div className={`w-8 h-full flex items-center justify-center border-l border-[#1a202c] ${isWinner ? 'bg-[#3182ce]' : 'bg-[#4a5568]'}`}>
          <span className="text-white text-xs font-bold">
            {isWinner ? "W" : "-"}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={`
        w-48 flex flex-col rounded overflow-hidden shadow-lg border transition-all z-10
        ${isClickable ? 'cursor-pointer hover:border-[#facc15] hover:shadow-[#facc15]/20' : 'cursor-default'}
        ${isActive ? 'border-[#facc15] shadow-[#facc15]/30 shadow-md scale-105' : 'border-[#4a5568]'}
        ${isCenter ? 'w-56 scale-110 mb-4' : ''}
      `}
    >
      {renderSlot(match.homePlayerId, isHomeWinner, homePlayer, match.isBye, "top")}
      {renderSlot(match.awayPlayerId, isAwayWinner, awayPlayer, match.isBye, "bottom")}
    </div>
  );
}
