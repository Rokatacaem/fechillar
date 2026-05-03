"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Client Component: Formulario de autenticación.
 * Post-login: navega a "/" para que el middleware evalúe el rol
 * y ejecute la redirección final al dashboard correspondiente.
 */
export default function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // AUTO-LOGIN BYPASS (Solicitado para desarrollo)
    useEffect(() => {
        if (searchParams.get('bypass') === 'true') {
            setEmail("admin@fechillar.cl");
            setPassword("bypass");
            // Pequeño delay para que React procese los estados antes de disparar el submit
            const timer = setTimeout(() => {
                const form = document.querySelector('form');
                form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const res = await signIn("credentials", {
                email: email.toLowerCase().trim(),
                password: password.trim(),
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

        const [showPassword, setShowPassword] = useState(false);
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
                {/* Background Decorativo */}
                <div className="absolute top-0 left-0 w-full h-1/2 bg-[var(--color-primary)] z-[-1] rounded-b-[50px]"></div>
    
                <div className="relative z-10 w-full max-w-md p-6">
                    <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-[var(--color-primary)]">Bienvenido</h1>
                            <p className="text-slate-500 mt-2">Portal de Federados Fechillar</p>
                        </div>
    
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                                    Correo Electrónico
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="username"
                                    required
                                    autoFocus
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all !text-black !bg-white relative z-20 placeholder:text-slate-500 font-medium"
                                    placeholder="admin@fechillar.cl"
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all !text-black !bg-white relative z-20 placeholder:text-slate-500 font-medium pr-12"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 z-30 text-slate-400 hover:text-slate-600 transition-colors p-1"
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 014.13-4.13m4.39-1.87A10.11 10.11 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 4.132m-3.424-3.424L11.25 12.75m-2.829 2.829L3 3m18 18l-9-9" /></svg>
                                        )}
                                    </button>
                                </div>
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

                        <button
                            type="button"
                            onClick={() => {
                                setEmail("admin@fechillar.cl");
                                setPassword("bypass");
                                setTimeout(() => {
                                    const form = document.querySelector('form');
                                    form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                                }, 100);
                            }}
                            className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-black text-xs uppercase tracking-widest shadow-md transition-all hover:scale-[1.02]"
                        >
                            ⚡ Bypass Admin (Modo Desarrollo)
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
