"use client";

import { useState } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Building2, Plus } from "lucide-react";
import { ClubCreateForm } from "./ClubCreateForm";

export function CreateClubDialog() {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger 
                render={
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] py-6 px-8 rounded-2xl shadow-lg border border-blue-400/30 flex items-center gap-3">
                      <Plus className="w-4 h-4" />
                      Registrar Nueva Sede
                  </Button>
                }
            />
            <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
                <DialogHeader>
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                        <Building2 className="w-6 h-6 text-blue-500" />
                    </div>
                    <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                        Alta de Sede Federada
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 font-mono text-xs uppercase tracking-widest">
                        Ingreso de nuevos activos al Sistema General de Federación
                    </DialogDescription>
                </DialogHeader>

                <div className="pt-4">
                    <ClubCreateForm onSuccess={() => setOpen(false)} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
