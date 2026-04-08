export default function Loading() {
    return (
        <div className="flex h-[60vh] w-full flex-col items-center justify-center space-y-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-500" />
            <p className="font-mono text-xs uppercase tracking-widest text-slate-500 animate-pulse">
                Sincronizando con Fechillar Cloud...
            </p>
        </div>
    );
}
