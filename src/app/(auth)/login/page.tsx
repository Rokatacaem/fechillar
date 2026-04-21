import { auth } from "@/auth";
import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";

/**
 * Server Component: Verifica sesión activa antes de renderizar el formulario.
 * Si existe sesión válida, el middleware ya debió haber redirigido, pero esto
 * actúa como segunda línea de defensa a nivel de Page.
 */
export default async function LoginPage() {
    const session = await auth();

    if (session?.user) {
        const role = (session.user as any).role as string;

        if (role === "SUPERADMIN" || role === "FEDERATION_ADMIN" || role === "ADMIN") {
            redirect("/admin/dashboard");
        }
        if (role === "CLUB_ADMIN" || role === "CLUB_DELEGATE") {
            redirect("/dashboard");
        }
        // Jugadores y usuarios base
        redirect("/player/dashboard");
    }

    // Sin sesión: render del formulario cliente
    return <LoginForm />;
}
