import fetch from 'node-fetch';
import 'dotenv/config';

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

const origin = 'Tropero Sosa 4614, M5513 Coquimbito, Mendoza, Argentina';
const dests = [
  'San Martin 450, Ciudad, Mendoza',
  'Paso de los Andes 200, Dorrego, Guaymallén',
  'Emilio Civit 300, Ciudad, Mendoza',
  'Av. Colón 1200, Godoy Cruz, Mendoza',
  'Belgrano 890, Las Heras, Mendoza',
  'Chile 450, San José, Guaymallén'
];

async function testOptimalOpenTSP() {
    const sanitize = (addr) => addr.toLowerCase().includes('mendoza') ? addr : `${addr}, Mendoza, Argentina`;
    const safeOrigin = sanitize(origin);
    const safeDests = dests.map(sanitize);

    const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';

    // We make N concurrent requests, where N is the number of stops.
    // Each request tests setting one stop as the final destination.
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
        
        // Reconstruct full sequence mapped to original indices
        const finalSequence = optGoogleIndices.map(optIdx => intermediates[optIdx].originalIndex);
        finalSequence.push(endIdx); // The destination we forced

        return {
            duration: durationSecs,
            sequence: finalSequence,
            endName: potentialEnd
        };
    });

    const results = await Promise.all(promises);
    
    // Find the one with minimum duration
    let bestResult = null;
    let minDuration = Infinity;

    results.forEach(res => {
        if (res && res.duration < minDuration) {
            minDuration = res.duration;
            bestResult = res;
        }
    });

    console.log(`BEST ROUTE found ending at ${bestResult.endName} in ${bestResult.duration}s`);
    console.log("SEQUENCE:");
    bestResult.sequence.forEach(idx => {
        console.log(`- ${dests[idx]}`);
    });
}

testOptimalOpenTSP();
