import fetch from 'node-fetch';
import 'dotenv/config';

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

const origin = 'Tropero Sosa 4614, M5513 Coquimbito, Mendoza, Argentina';
const dests = [
  { name: 'Carnicería Don Pedro', address: 'San Martin 450, M5515 Maipú, Mendoza' },
  { name: 'Almacén El Vecino', address: 'Paso de los Andes 200, Dorrego, Guaymallén, Mendoza' },
  { name: 'Restaurant Don Julio', address: 'Emilio Civit 300, Ciudad de Mendoza, Mendoza' },
  { name: 'Supermercado El Ángel', address: 'Av. San Martín Sur 1200, Godoy Cruz, Mendoza' },
  { name: 'Rotisería La Abuela', address: 'Dr. Moreno 1100, Las Heras, Mendoza' },
  { name: 'Granja Feliz', address: 'Chile 450, San José, Guaymallén, Mendoza' }
];

async function testOptimalOpenTSP() {
    const safeOrigin = origin;
    const safeDests = dests.map(d => d.address);

    const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';

    const promises = safeDests.map(async (potentialEnd, endIdx) => {
        const intermediates = safeDests.map((addr, i) => ({
            address: addr,
            originalIndex: i
        })).filter(x => x.originalIndex !== endIdx);

        const body = {
            origin: { address: safeOrigin },
            destination: { address: potentialEnd },
            intermediates: intermediates.map(d => ({ address: d.address })),
            travelMode: "DRIVE",
            routingPreference: "TRAFFIC_AWARE",
            optimizeWaypointOrder: true
        };

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'routes.optimizedIntermediateWaypointIndex,routes.duration'
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        if (!data.routes || !data.routes[0]) return null;
        
        const route = data.routes[0];
        const durationSecs = parseInt(route.duration.replace('s', ''));
        const optGoogleIndices = route.optimizedIntermediateWaypointIndex || intermediates.map((_, i) => i);
        const finalSequence = optGoogleIndices.map(optIdx => intermediates[optIdx].originalIndex);
        finalSequence.push(endIdx);

        return {
            duration: durationSecs,
            sequence: finalSequence
        };
    });

    const results = await Promise.all(promises);
    let bestResult = null;
    let minDuration = Infinity;

    results.forEach(res => {
        if (res && res.duration < minDuration) {
            minDuration = res.duration;
            bestResult = res;
        }
    });

    console.log(`BEST ROUTE found in ${bestResult.duration}s`);
    bestResult.sequence.forEach(idx => {
        console.log(`- [${idx}] ${dests[idx].name}: ${dests[idx].address}`);
    });
}

testOptimalOpenTSP();
