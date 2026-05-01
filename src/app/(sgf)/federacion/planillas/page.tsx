"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Printer, Save, FileText, ChevronDown, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { generateScoreSheetPDF, ScoreSheetData } from '@/lib/pdf/score-sheet-generator';

const PHASES = [
    "Fase de Grupos",
    "Dieciseisavos",
    "Octavos de Final",
    "Cuartos de Final",
    "Semifinales",
    "Tercer Lugar",
    "Final"
];

interface MatchEntry {
    id: string;
    player1: string;
    club1: string;
    player2: string;
    club2: string;
    group: string;
    matchNo: string;
    tableNo: string;
    phase: string;
}

export default function ScoreSheetsPage() {
    const [tournamentTitle, setTournamentTitle] = useState("Torneo Nacional Billar 3 bandas sin handicap");
    const [clubSede, setClubSede] = useState("Club de Billar Santiago Mayo 2026");
    const [selectedPhase, setSelectedPhase] = useState(PHASES[0]);
    const [matches, setMatches] = useState<MatchEntry[]>([]);
    
    // Form state
    const [newMatch, setNewMatch] = useState<Partial<MatchEntry>>({
        player1: "",
        club1: "",
        player2: "",
        club2: "",
        group: "",
        matchNo: "",
        tableNo: ""
    });

    // Load from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('fechillar_planillas_data');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                setTournamentTitle(data.title || tournamentTitle);
                setClubSede(data.sede || clubSede);
                setMatches(data.matches || []);
            } catch (e) {
                console.error("Error loading saved data", e);
            }
        }
    }, []);

    // Save to localStorage
    const saveData = () => {
        const data = {
            title: tournamentTitle,
            sede: clubSede,
            matches: matches
        };
        localStorage.setItem('fechillar_planillas_data', JSON.stringify(data));
        toast.success("Datos guardados localmente");
    };

    const addMatch = () => {
        if (!newMatch.player1 || !newMatch.player2 || !newMatch.matchNo) {
            toast.error("Complete los campos obligatorios (Jugadores y N° Partido)");
            return;
        }

        const entry: MatchEntry = {
            id: crypto.randomUUID(),
            player1: newMatch.player1 || "",
            club1: newMatch.club1 || "",
            player2: newMatch.player2 || "",
            club2: newMatch.club2 || "",
            group: newMatch.group || "",
            matchNo: newMatch.matchNo || "",
            tableNo: newMatch.tableNo || "",
            phase: selectedPhase
        };

        setMatches([...matches, entry]);
        setNewMatch({
            player1: "",
            club1: "",
            player2: "",
            club2: "",
            group: "",
            matchNo: "",
            tableNo: ""
        });
        toast.success("Partido agregado");
    };

    const removeMatch = (id: string) => {
        setMatches(matches.filter(m => m.id !== id));
        toast.info("Partido eliminado");
    };

    const handlePrint = async () => {
        const phaseMatches = matches.filter(m => m.phase === selectedPhase);
        if (phaseMatches.length === 0) {
            toast.error("No hay partidos agregados para esta fase");
            return;
        }

        const dataList: ScoreSheetData[] = phaseMatches.map(m => ({
            tournamentTitle,
            clubSede,
            phase: m.phase,
            player1: { name: m.player1, club: m.club1 },
            player2: { name: m.player2, club: m.club2 },
            group: m.group,
            matchNo: m.matchNo,
            tableNo: m.tableNo
        }));

        toast.promise(generateScoreSheetPDF(dataList), {
            loading: 'Generando PDF...',
            success: 'PDF generado correctamente',
            error: 'Error al generar el PDF'
        });
    };

    const filteredMatches = matches.filter(m => m.phase === selectedPhase);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                        Generador de Planillas Oficiales
                    </h1>
                    <p className="text-slate-400">Billar 3 Bandas - Sistema de Impresión</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={saveData} className="gap-2 border-slate-700 bg-slate-900 hover:bg-slate-800">
                        <Save className="w-4 h-4" /> Guardar Progreso
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* CONFIGURACIÓN */}
                <Card className="bg-slate-900 border-slate-800 lg:col-span-1 h-fit sticky top-8">
                    <CardHeader>
                        <CardTitle className="text-slate-100 flex items-center gap-2">
                            <Edit3 className="w-5 h-5 text-emerald-400" /> Configuración Global
                        </CardTitle>
                        <CardDescription className="text-slate-400">Aparecerá en el encabezado de todas las planillas</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Título del Torneo</label>
                            <Input 
                                value={tournamentTitle} 
                                onChange={(e) => setTournamentTitle(e.target.value)}
                                className="bg-slate-950 border-slate-800 focus:border-emerald-500/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Club Sede / Fecha</label>
                            <Input 
                                value={clubSede} 
                                onChange={(e) => setClubSede(e.target.value)}
                                className="bg-slate-950 border-slate-800 focus:border-emerald-500/50"
                            />
                        </div>
                        <hr className="border-slate-800 my-4" />
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Fase del Torneo</label>
                            <div className="relative">
                                <select 
                                    value={selectedPhase}
                                    onChange={(e) => setSelectedPhase(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                >
                                    {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
                            </div>
                        </div>
                        <Button 
                            onClick={handlePrint} 
                            disabled={filteredMatches.length === 0}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 gap-2 mt-4"
                        >
                            <Printer className="w-5 h-5" /> IMPRIMIR {filteredMatches.length} PLANILLAS
                        </Button>
                    </CardContent>
                </Card>

                {/* GESTIÓN DE PARTIDOS */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-slate-900 border-slate-800 overflow-hidden">
                        <div className="h-1 bg-gradient-to-r from-emerald-500 to-blue-600" />
                        <CardHeader>
                            <CardTitle className="text-slate-100 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-blue-400" /> Agregar Partido a {selectedPhase}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-4 p-4 rounded-lg bg-slate-950/50 border border-slate-800/50">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Jugador 1</h3>
                                    <Input 
                                        placeholder="Nombre Jugador 1" 
                                        value={newMatch.player1}
                                        onChange={(e) => setNewMatch({...newMatch, player1: e.target.value})}
                                        className="bg-slate-950 border-slate-800"
                                    />
                                    <Input 
                                        placeholder="Club Jugador 1" 
                                        value={newMatch.club1}
                                        onChange={(e) => setNewMatch({...newMatch, club1: e.target.value})}
                                        className="bg-slate-950 border-slate-800"
                                    />
                                </div>
                                <div className="space-y-4 p-4 rounded-lg bg-slate-950/50 border border-slate-800/50">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Jugador 2</h3>
                                    <Input 
                                        placeholder="Nombre Jugador 2" 
                                        value={newMatch.player2}
                                        onChange={(e) => setNewMatch({...newMatch, player2: e.target.value})}
                                        className="bg-slate-950 border-slate-800"
                                    />
                                    <Input 
                                        placeholder="Club Jugador 2" 
                                        value={newMatch.club2}
                                        onChange={(e) => setNewMatch({...newMatch, club2: e.target.value})}
                                        className="bg-slate-950 border-slate-800"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mt-4">
                                <Input 
                                    placeholder="Grupo" 
                                    value={newMatch.group}
                                    onChange={(e) => setNewMatch({...newMatch, group: e.target.value})}
                                    className="bg-slate-950 border-slate-800"
                                />
                                <Input 
                                    placeholder="N° Partido" 
                                    value={newMatch.matchNo}
                                    onChange={(e) => setNewMatch({...newMatch, matchNo: e.target.value})}
                                    className="bg-slate-950 border-slate-800"
                                />
                                <Input 
                                    placeholder="Mesa" 
                                    value={newMatch.tableNo}
                                    onChange={(e) => setNewMatch({...newMatch, tableNo: e.target.value})}
                                    className="bg-slate-950 border-slate-800"
                                />
                            </div>
                            <Button onClick={addMatch} className="w-full mt-6 bg-blue-600 hover:bg-blue-500 gap-2">
                                <Plus className="w-4 h-4" /> Agregar a la Lista
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <FileText className="w-5 h-5 text-emerald-400" /> 
                                Lista de Partidos: <span className="text-emerald-400">{selectedPhase}</span>
                            </h2>
                            <p className="text-xs text-slate-500">{filteredMatches.length} partidos encontrados</p>
                        </div>

                        <AnimatePresence mode="popLayout">
                            {filteredMatches.length === 0 ? (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-12 border-2 border-dashed border-slate-800 rounded-xl text-center text-slate-500"
                                >
                                    No hay partidos agregados para esta fase.
                                </motion.div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredMatches.map((match) => (
                                        <motion.div
                                            key={match.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="bg-slate-900 border border-slate-800 p-4 rounded-lg group hover:border-emerald-500/50 transition-colors"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-slate-950 text-emerald-400 text-[10px] font-black px-2 py-1 rounded border border-emerald-500/20 uppercase">
                                                        Mesa {match.tableNo || '?'}
                                                    </span>
                                                    <span className="bg-slate-950 text-blue-400 text-[10px] font-black px-2 py-1 rounded border border-blue-500/20 uppercase">
                                                        Partido {match.matchNo}
                                                    </span>
                                                </div>
                                                <button 
                                                    onClick={() => removeMatch(match.id)}
                                                    className="text-slate-600 hover:text-red-400 p-1 rounded hover:bg-red-400/10 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-sm">
                                                    <span className="font-bold text-slate-200">{match.player1}</span>
                                                    <span className="text-slate-500 text-xs">{match.club1}</span>
                                                </div>
                                                <div className="flex items-center gap-2 py-1">
                                                    <div className="h-[1px] flex-1 bg-slate-800" />
                                                    <span className="text-[10px] font-bold text-slate-700 italic">VS</span>
                                                    <div className="h-[1px] flex-1 bg-slate-800" />
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="font-bold text-slate-200">{match.player2}</span>
                                                    <span className="text-slate-500 text-xs">{match.club2}</span>
                                                </div>
                                            </div>
                                            {match.group && (
                                                <div className="mt-3 pt-3 border-t border-slate-800 text-[10px] text-slate-500 font-medium">
                                                    GRUPO: {match.group}
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
