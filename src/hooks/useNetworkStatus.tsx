"use client";

import { useEffect, useState, useCallback } from "react";

type ConnectionType = "wifi" | "4g" | "3g" | "ethernet" | "unknown";

interface NetworkStatus {
    isOnline: boolean;
    connectionType: ConnectionType;
    rtt: number | null;       // Round-trip-time en ms
    downlink: number | null;  // Mbps estimados
    isLowLatency: boolean;
}

/**
 * Hook que monitorea la calidad de conexión de red del tótem.
 * Invisible para el público, vital para el Director de Torneo.
 */
export function useNetworkStatus(): NetworkStatus {
    const [status, setStatus] = useState<NetworkStatus>({
        isOnline: true,
        connectionType: "unknown",
        rtt: null,
        downlink: null,
        isLowLatency: true
    });

    const updateStatus = useCallback(() => {
        const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

        let connectionType: ConnectionType = "unknown";
        if (connection) {
            const effectiveType = connection.effectiveType || "";
            if (effectiveType === "4g") connectionType = "4g";
            else if (effectiveType === "3g") connectionType = "3g";
            else if (effectiveType === "wifi" || connection.type === "wifi") connectionType = "wifi";
            else if (connection.type === "ethernet") connectionType = "ethernet";
        }

        setStatus({
            isOnline: navigator.onLine,
            connectionType,
            rtt: connection?.rtt ?? null,
            downlink: connection?.downlink ?? null,
            isLowLatency: (connection?.rtt ?? 0) < 100
        });
    }, []);

    useEffect(() => {
        updateStatus();
        window.addEventListener("online", updateStatus);
        window.addEventListener("offline", updateStatus);
        const conn = (navigator as any).connection;
        conn?.addEventListener("change", updateStatus);

        return () => {
            window.removeEventListener("online", updateStatus);
            window.removeEventListener("offline", updateStatus);
            conn?.removeEventListener("change", updateStatus);
        };
    }, [updateStatus]);

    return status;
}

// ─────────────────────────────────────────────
// COMPONENTE VISUAL (Director-Only Badge)
// ─────────────────────────────────────────────

export function NetworkStatusBadge() {
    const net = useNetworkStatus();

    const icons: Record<string, string> = {
        wifi: "📶", "4g": "📡", "3g": "📡", ethernet: "🔌", unknown: "❓"
    };

    const bgColor = !net.isOnline
        ? "bg-rose-900/70 border-rose-700 text-rose-300"
        : net.isLowLatency
        ? "bg-emerald-900/50 border-emerald-700 text-emerald-300"
        : "bg-amber-900/50 border-amber-700 text-amber-300";

    return (
        <div className={`fixed bottom-4 left-4 z-50 font-mono text-[10px] border rounded-lg px-3 py-1.5 backdrop-blur flex items-center gap-2 ${bgColor}`}>
            <span>{icons[net.connectionType]}</span>
            <span>{net.connectionType.toUpperCase()}</span>
            {net.rtt !== null && <span className="text-slate-400">RTT: {net.rtt}ms</span>}
            {!net.isOnline && <span className="font-bold animate-pulse">OFFLINE</span>}
        </div>
    );
}
