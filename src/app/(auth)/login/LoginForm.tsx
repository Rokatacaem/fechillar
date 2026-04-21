"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Client Component: Formulario de autenticación.
 * Post-login: navega a "/" para que el middleware evalúe el rol
 * y ejecute la redirección final al dashboard correspondiente.
 */
export default function LoginForm() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,   // Manejamos el redirect manualmente
            });

            if (res?.error) {
                setError("Credenciales inválidas. Verifica tu correo y contraseña.");
                return;
            }

            // El middleware.ts detectará la sesión y redirigirá según el rol.
            router.push("/");
            router.refresh();

        } catch {
            setError("Error de conexión. Intenta nuevamente.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
            {/* Background Decorativo */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-[var(--color-primary)] z-0 rounded-b-[50px]"></div>

            <div className="relative z-10 w-full max-w-md p-6">
                <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-[var(--color-primary)]">Bienvenido</h1>
                        <p className="text-slate-500 mt-2">Portal de Federados Fechillar</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Correo Electrónico
                            </label>
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
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Contraseña
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-[var(--color-primary)] hover:bg-blue-900 disabled:bg-slate-400 text-white rounded-lg font-bold shadow-lg transition-all hover:scale-[1.02] disabled:scale-100 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                    </svg>
                                    Verificando...
                                </>
                            ) : "Ingresar"}
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
