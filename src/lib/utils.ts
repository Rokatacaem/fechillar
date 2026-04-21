import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseLegalStatus(raw: string | null) {
    let compliance = { expiryDate: "", deferredUntil: "", notes: "" };
    
    if (!raw) return compliance;

    if (raw.trim().startsWith('{')) {
        try {
            const parsed = JSON.parse(raw);
            // Manejar tanto minúsculas como madiúsculas por inconsistencia en DB
            compliance.expiryDate = parsed.expiryDate || parsed.EXPIRYDATE || "";
            compliance.deferredUntil = parsed.deferredUntil || parsed.DEFERREDUNTIL || "";
            compliance.notes = parsed.notes || parsed.NOTES || "";
        } catch (e) {
            compliance.expiryDate = raw;
        }
    } else {
        compliance.expiryDate = raw;
    }

    return compliance;
}
