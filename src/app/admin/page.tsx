import { redirect } from "next/navigation";

/**
 * ARCHIVO DE SEGURIDAD: Evita el error 404 al intentar acceder a la ruta base /admin.
 * Redirige automáticamente al Dashboard Administrativo oficial.
 */
export default function AdminRootPage() {
  redirect("/admin/dashboard");
}
