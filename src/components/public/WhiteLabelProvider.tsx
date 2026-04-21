"use client";

import React, { useMemo } from "react";

interface WhiteLabelProviderProps {
    children: React.ReactNode;
    brandColor?: string | null;
    accentColor?: string | null;
}

/**
 * Proveedor de White-labeling táctico.
 * Inyecta variables CSS en un contenedor para que los componentes hijos
 * puedan usar var(--color-primary) y var(--color-accent).
 */
export function WhiteLabelProvider({ children, brandColor, accentColor }: WhiteLabelProviderProps) {
    const styles = useMemo(() => ({
        "--color-primary": brandColor || "#0ea5e9", // Sky-500 default
        "--color-accent": accentColor || "#10b981",  // Emerald-500 default
    } as React.CSSProperties), [brandColor, accentColor]);

    return (
        <div style={styles} className="contents">
            {children}
        </div>
    );
}
