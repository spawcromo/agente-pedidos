// Mocking the core optimization logic for testing
// This script simulates the solver behavior in maps.ts

const SERVICE_TIME_SEC = 10 * 60; // 10 mins
const START_TIME_SEC = 7 * 3600; // 07:00 AM

function parseTime(timeStr) {
    const [h, m] = timeStr.trim().split(':').map(Number);
    return (h * 3600) + (m * 60);
}

function parseWindow(windowStr) {
    if (!windowStr || !windowStr.includes('-')) return { start: 0, end: 86400 };
    const [startS, endS] = windowStr.split('-');
    return { start: parseTime(startS), end: parseTime(endS) };
}

function solve(distMatrix, durMatrix, windows) {
    let bestSeq = [];
    let minScore = Infinity;
    const numDests = windows.length;

    function search(currentIdx, remaining, currentPath, currentDist, currentTimeSec, totalWaitSec, totalLateSec) {
        if (remaining.length === 0) {
            const score = currentDist + (totalLateSec * 100);
            if (score < minScore) {
                minScore = score;
                bestSeq = [...currentPath];
            }
            return;
        }

        if (currentDist >= minScore) return;

        for (let i = 0; i < remaining.length; i++) {
            const next = remaining[i];
            const nextRemaining = [...remaining.slice(0, i), ...remaining.slice(i + 1)];
            
            const transitSec = durMatrix[currentIdx][next + 1];
            let arrivalTime = currentTimeSec + transitSec;
            
            let waitSec = 0;
            let lateSec = 0;
            
            const window = windows[next];
            if (arrivalTime < window.start) {
                waitSec = window.start - arrivalTime;
                arrivalTime = window.start;
            } else if (arrivalTime > window.end) {
                lateSec = arrivalTime - window.end;
            }

            search(
                next + 1,
                nextRemaining,
                [...currentPath, next],
                currentDist + distMatrix[currentIdx][next + 1],
                arrivalTime + SERVICE_TIME_SEC,
                totalWaitSec + waitSec,
                totalLateSec + lateSec
            );
        }
    }

    const destIndices = Array.from({ length: numDests }, (_, i) => i);
    search(0, destIndices, [], 0, START_TIME_SEC, 0, 0);
    return bestSeq;
}

// TEST CASES
console.log("--- INICIANDO TESTS DE QA SENIOR - OPTIMIZACION DE RUTAS ---\n");

async function runTest(name, distMatrix, durMatrix, windows, expectedOrder) {
    console.log(`TEST: ${name}`);
    const result = solve(distMatrix, durMatrix, windows.map(parseWindow));
    const passed = JSON.stringify(result) === JSON.stringify(expectedOrder);
    
    if (passed) {
        console.log("✅ PASÓ: El orden optimizado es el esperado.");
    } else {
        console.log(`❌ FALLÓ: Esperaba ${expectedOrder}, pero obtuve ${result}`);
    }
    console.log("");
    return passed;
}

// 1. Distancia vs Ventana Horaria (El caso clásico)
// Parada 0: A 1km pero abre a las 11:00 am
// Parada 1: A 10km pero abre a las 07:05 am
// El algoritmo debería ir primero a la parada 1 (lejos pero temprano) y luego a la 0.
const t1_dist = [
    [0, 1000, 10000],  // Warehouse to 0, 1
    [1000, 0, 9000],   // 0 to warehouse, 1
    [10000, 9000, 0]   // 1 to warehouse, 0
];
const t1_dur = [
    [0, 120, 1200],    // 2min, 20min
    [120, 0, 1080],
    [1200, 1080, 0]
];
const t1_windows = ["11:00-12:00", "07:05-08:00"];

runTest("Distancia vs Ventana Horaria", t1_dist, t1_dur, t1_windows, [1, 0]);

// 2. Ventanas traslapadas pero lógicas
// 0: 07:00-09:00
// 1: 08:00-10:00
// 2: 09:00-11:00
// Debería ser 0, 1, 2
const t2_dist = [
    [0, 500, 1000, 1500],
    [500, 0, 500, 1000],
    [1000, 500, 0, 500],
    [1500, 1000, 500, 0]
];
const t2_windows = ["07:00-09:00", "08:00-10:00", "09:00-11:00"];
runTest("Ventanas Secuenciales", t2_dist, t2_dist, t2_windows, [0, 1, 2]);

// 3. Forzar espera (Gap en el medio)
// O -> A (temprano)
// O -> B (muy tarde)
// Distancia da igual, orden obligatorio A -> B
const t3_windows = ["07:00-08:00", "15:00-17:00"];
runTest("Forzar Espera (Gap)", t1_dist, t1_dur, t3_windows, [0, 1]);

console.log("--- TESTS FINALIZADOS ---");
