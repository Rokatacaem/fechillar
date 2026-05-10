import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SixteenthsPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-6 space-y-6">
      <Link
        href="/tournaments"
        className="inline-flex items-center gap-2 p-3 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>
      <h1 className="text-2xl font-bold text-white mb-4">16avos de Final</h1>
      <p className="text-slate-400">Fase en desarrollo...</p>
    </div>
  );
}
