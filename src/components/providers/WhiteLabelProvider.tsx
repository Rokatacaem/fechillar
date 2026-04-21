"use client";

import React, { useEffect } from "react";

interface WhiteLabelConfig {
    brandColor?: string | null;
    accentColor?: string | null;
    logoUrl?: string | null;
}

interface WhiteLabelProviderProps {
    config: WhiteLabelConfig;
    children: React.ReactNode;
}

/**
 * WhiteLabelProvider: Inyecta variables CSS en el :root para personalización dinámica.
 */
export function WhiteLabelProvider({ config, children }: WhiteLabelProviderProps) {
    useEffect(() => {
        const root = document.documentElement;
        
        // Colores por defecto (Branding Fechillar)
        const defaultBrand = "#0f2040";
        const defaultAccent = "#10b981";

        if (config.brandColor) {
            root.style.setProperty("--color-primary", config.brandColor);
            // También actualizamos la variante de shadcn si aplica
            root.style.setProperty("--primary", config.brandColor);
        } else {
            root.style.setProperty("--color-primary", defaultBrand);
        }

        if (config.accentColor) {
            root.style.setProperty("--color-accent", config.accentColor);
            root.style.setProperty("--accent", config.accentColor);
        } else {
            root.style.setProperty("--color-accent", defaultAccent);
        }

        // Cleanup al desmontar
        return () => {
            root.style.removeProperty("--color-primary");
            root.style.removeProperty("--color-accent");
        };
    }, [config.brandColor, config.accentColor]);

    return <>{children}</>;
}
