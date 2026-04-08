import React from "react";

export default function PlayersLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Neutralizado para evitar conflictos con el Sidebar principal del SGF
    return <>{children}</>;
}
