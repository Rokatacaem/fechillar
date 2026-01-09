"use client";

import { useState } from "react";
// import { signIn } from "next-auth/react"; // We'll implement the action manually or use client hook later
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Temporary simulation for demo flow until we wire up client-side next-auth completely
        if (email === "admin@fechillar.cl" && password === "admin123") {
            // redirect to pretend dashboard or just handle via next-auth signIn in real impl
            console.log("Admin login attempt");
        }

        try {
            // Using NextAuth signIn (would need to be imported) or valid API call
            // const res = await signIn("credentials", { email, password, redirect: false });
            console.log("Logging in...", email);
            // For now, let's just simulate specific redirects for the demo flow
            if (email.includes("player")) router.push("/player");
            else if (email.includes("admin")) router.push("/official");
            else router.push("/player");

        } catch (err) {
            setError("Credenciales inválidas");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
            {/* Background Decorative */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-[var(--color-primary)] z-0 rounded-b-[50px]"></div>

            <div className="relative z-10 w-full max-w-md p-6">
                <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-[var(--color-primary)]">Bienvenido</h1>
                        <p className="text-slate-500 mt-2">Portal de Federados Fechillar</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Correo Electrónico</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all"
                                placeholder="rut@fechillar.cl"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Contraseña</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <button
                            type="submit"
                            className="w-full py-4 bg-[var(--color-primary)] hover:bg-blue-900 text-white rounded-lg font-bold shadow-lg transition-transform hover:scale-[1.02]"
                        >
                            Ingresar
                        </button>
                    </form>

                    <div className="text-center border-t border-slate-100 pt-6">
                        <p className="text-sm text-slate-500">¿No tienes cuenta?</p>
                        <Link href="/register" className="text-[var(--color-secondary)] font-semibold hover:underline">
                            Solicitar Afiliación
                        </Link>
                    </div>
                </div>

                <div className="text-center mt-8 text-slate-400 text-sm">
                    <Link href="/" className="hover:text-slate-600">← Volver al inicio</Link>
                </div>
            </div>
        </div>
    );
}
