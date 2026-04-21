import { determine3BWinner, MatchData } from "./rules";

const testMatch: MatchData = {
    homeScore: 21,
    homeTarget: 22,
    homeInnings: 20, // Simulando mismas entradas en caso de final por tiempo/límite
    awayScore: 27,
    awayTarget: 28,
    awayInnings: 20,
    homeHighRun: 5,
    awayHighRun: 6
};

const result = determine3BWinner(testMatch);

console.log("Simulación de Caso de Prueba de Victoria por Eficiencia");
console.log("-----------------------------------------------------");
console.log(`Jugador 1 (21/22): Eficiencia = ${(21/22).toFixed(4)}, Factor 1.27`);
console.log(`Jugador 2 (27/28): Eficiencia = ${(27/28).toFixed(4)}, Factor 1.00`);
console.log(`Resultado: ${result.winner} gana por motivo: ${result.reason}`);
console.log(`Home Eficiencia: ${result.homeEficiencia.toFixed(4)}`);
console.log(`Away Eficiencia: ${result.awayEficiencia.toFixed(4)}`);

if (result.winner === 'AWAY' && result.homeEficiencia === (21/22) && result.awayEficiencia === (27/28)) {
    console.log("✅ EL TEST HA PASADO DE FORMA CORRECTA.");
} else {
    console.log("❌ ERROR EN LA LÓGICA DE SIMULACIÓN.");
}
