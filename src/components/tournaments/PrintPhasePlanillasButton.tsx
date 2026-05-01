"use client";

import React, { useState } from 'react';
import { Printer, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getPlanillaData } from '@/actions/planilla-actions';
import { generateScoreSheetPDF } from '@/lib/pdf/score-sheet-generator';

interface PrintPhasePlanillasButtonProps {
    tournamentId: string;
    phaseName: string;
    variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
    className?: string;
}

export function PrintPhasePlanillasButton({ 
    tournamentId, 
    phaseName, 
    variant = "outline",
    className = "" 
}: PrintPhasePlanillasButtonProps) {
    const [loading, setLoading] = useState(false);

    const handlePrint = async () => {
        setLoading(true);
        try {
            const result = await getPlanillaData(tournamentId, phaseName);
            
            if (!result.success || !result.data) {
                toast.error(result.error || "No se pudieron obtener los datos de la fase");
                return;
            }

            if (result.data.length === 0) {
                toast.warning(`No hay partidos configurados para la fase: ${phaseName}`);
                return;
            }

            toast.loading(`Generando ${result.data.length} planillas...`, { id: 'print-job' });
            
            await generateScoreSheetPDF(result.data);
            
            toast.success("Planillas generadas correctamente", { id: 'print-job' });
        } catch (error) {
            console.error("Error printing planillas:", error);
            toast.error("Error al generar el PDF", { id: 'print-job' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button 
            onClick={handlePrint} 
            disabled={loading}
            variant={variant}
            className={`gap-2 ${className}`}
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            Imprimir Planillas
        </Button>
    );
}
