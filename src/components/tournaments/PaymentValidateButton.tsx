"use client";

import React, { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { confirmPayment } from "@/app/(sgf)/tournaments/inscripciones/payment-actions";
import { useRouter } from "next/navigation";

export function PaymentValidateButton({ registrationId }: { registrationId: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleValidate = async () => {
        const ref = window.prompt("Ingrese el código de transferencia o referencia de cobro:", "REF-" + Math.floor(Math.random() * 10000));
        if (!ref) return;

        setLoading(true);
        try {
            // Simulamos monto fijo de 15000 CLP para esta etapa
            const res = await confirmPayment(registrationId, 15000, ref);
            if (res.success) {
                router.refresh();
            } else {
                alert(res.error);
            }
        } catch (e: any) {
            alert("Fallo de conexión");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button 
            onClick={handleValidate}
            disabled={loading}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
        >
            {loading ? <Loader2 className="w-3 h-3 animate-spin"/> : <Check className="w-3 h-3" />}
            VALIDAR PAGO
        </button>
    );
}
