/**
 * SGF - GENERADOR DE MOCK EXCEL
 * Crea el archivo 'Torneo_Abril_SanMiguel.xlsx' para probar el motor de ingesta.
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const XLSX = require("xlsx");
import * as path from "path";

async function generateMock() {
    console.log("📝 Generando archivo Excel de prueba...");

    const wb = XLSX.utils.book_new();

    // 1. Pestaña FASE DE GRUPOS
    const gruposData = [
        { Jugador: "Luis", Carambolas: 15, Entradas: 35, Handicap: 28 },
        { Jugador: "Rodrigo Zúñiga", Carambolas: 20, Entradas: 35, Handicap: 24 },
        { Jugador: "Felipe Gallegos", Carambolas: 15, Entradas: 20, Handicap: 28 },
        { Jugador: "Alejandro Carvajal", Carambolas: 12, Entradas: 22, Handicap: 30 }
    ];
    const wsGrupos = XLSX.utils.json_to_sheet(gruposData);
    XLSX.utils.book_append_sheet(wb, wsGrupos, "FASE DE GRUPOS");

    // 2. Pestaña CLASIFICADOS
    const clasificadosData = [
        { Jugador: "Rodrigo Zúñiga" },
        { Jugador: "Luis" },
        { Jugador: "Felipe Gallegos" },
        { Jugador: "Alejandro Carvajal" }
    ];
    const wsClasificados = XLSX.utils.json_to_sheet(clasificadosData);
    XLSX.utils.book_append_sheet(wb, wsClasificados, "CLASIFICADOS");

    const filePath = path.join(process.cwd(), "Torneo_Abril_SanMiguel.xlsx");
    XLSX.writeFile(wb, filePath);

    console.log(`✅ Archivo generado en: ${filePath}`);
    console.log("Ahora puedes ejecutar: npx ts-node src/scripts/import-historical-excel.ts");
}

generateMock().catch(console.error);
