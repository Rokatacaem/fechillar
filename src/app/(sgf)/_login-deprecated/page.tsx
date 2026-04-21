import { notFound } from "next/navigation";

/**
 * RUTA INVALIDADA — No borrar hasta poder eliminar la carpeta en Windows.
 *
 * Esta página está bloqueada a nivel de Next.js con notFound().
 * Next.js la trata como una ruta 404, cediendo el control
 * a la ruta canónica /login definida en el grupo (auth).
 *
 * Para eliminar definitivamente:
 *   Remove-Item -Recurse -Force "src\app\(sgf)\login"
 */
export default function InvalidatedRoute() {
    notFound(); // Fuerza un 404 inmediato en el servidor para esta ruta
}
