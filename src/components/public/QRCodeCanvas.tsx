"use client";

import React, { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface QRCodeCanvasProps {
    value: string;
    size?: number;
}

export function QRCodeCanvas({ value, size = 120 }: QRCodeCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current) {
            QRCode.toCanvas(canvasRef.current, value, {
                width: size,
                margin: 0,
                color: {
                    dark: "#000000",
                    light: "#ffffff",
                },
            }, (error) => {
                if (error) console.error("Error generating QR Code:", error);
            });
        }
    }, [value, size]);

    return (
        <canvas 
            ref={canvasRef} 
            className="rounded-3xl"
            style={{ width: size, height: size }} 
        />
    );
}
