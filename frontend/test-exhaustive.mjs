import fetch from 'node-fetch';
import 'dotenv/config';

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

const origin = 'Tropero Sosa 4614, M5513 Coquimbito, Mendoza, Argentina';
const dests = [
  'San Martin 450, M5515 Maipú, Mendoza',
  'Paso de los Andes 200, Dorrego, Guaymallén, Mendoza',
  'Emilio Civit 300, Ciudad de Mendoza, Mendoza',
  'Av. San Martín Sur 1200, Godoy Cruz, Mendoza',
  'Dr. Moreno 1100, Las Heras, Mendoza',
  'Chile 450, San José, Guaymallén, Mendoza'
];

async function solveTSP() {
    const addresses = [origin, ...dests];
    const matrixUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${addresses.map(encodeURIComponent).join('|')}&destinations=${dests.map(encodeURIComponent).join('|')}&key=${apiKey}`;
    
    const res = await fetch(matrixUrl);
    const data = await res.json();
    
    if (data.status !== 'OK') {
        console.error("Matrix error:", data.status, data.error_message);
        return;
    }

    const getDist = (fromIdx, toIdx) => {
        const row = data.rows[fromIdx];
        if (!row) return 99999999;
        const el = row.elements[toIdx];
        if (!el || el.status !== 'OK') return 99999999;
        return el.distance.value;
    };

    const permutations = (arr) => {
        if (arr.length <= 1) return [arr];
        return arr.reduce((acc, current, i) => {
            const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
            const perms = permutations(remaining);
            return [...acc, ...perms.map(p => [current, ...p])];
        }, []);
    };

    const destIndices = Array.from({length: dests.length}, (_, i) => i);
    const allRoutes = permutations(destIndices);

    let minTotalDist = Infinity;
    let bestSeq = [];

    allRoutes.forEach(route => {
        let total = getDist(0, route[0]); // warehouse to first
        for (let i = 0; i < route.length - 1; i++) {
            total += getDist(route[i] + 1, route[i + 1]);
        }
        if (total < minTotalDist) {
            minTotalDist = total;
            bestSeq = route;
        }
    });

    console.log("BEST DISTANCE-BASED OPEN TSP:");
    bestSeq.forEach(idx => {
        console.log(`- [${idx}] ${dests[idx]}`);
    });
    console.log(`Total Distance: ${minTotalDist}m`);
}

solveTSP();
