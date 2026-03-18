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

async function testDistanceVsDuration() {
    const safeOrigin = origin;
    const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';

    const testStrategy = async (pref) => {
        // Just pick one ending for simplicity (e.g. Las Heras)
        const lastIdx = 4;
        const potentialEnd = dests[lastIdx];
        const intermediates = dests.map((d, i) => ({ address: d, i })).filter(x => x.i !== lastIdx);

        const body = {
            origin: { address: safeOrigin },
            destination: { address: potentialEnd },
            intermediates: intermediates.map(d => ({ address: d.address })),
            travelMode: "DRIVE",
            routingPreference: pref,
            optimizeWaypointOrder: true
        };

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'routes.optimizedIntermediateWaypointIndex,routes.duration,routes.distanceMeters'
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        const route = data.routes[0];
        const seq = route.optimizedIntermediateWaypointIndex.map(idx => intermediates[idx].i);
        seq.push(lastIdx);
        
        return {
            pref,
            duration: route.duration,
            distance: route.distanceMeters,
            sequence: seq
        };
    };

    const aware = await testStrategy("TRAFFIC_AWARE");
    const unaware = await testStrategy("ROUTING_PREFERENCE_UNSPECIFIED");

    console.log("TRAFFIC_AWARE:", aware.sequence, "Dist:", aware.distance, "Time:", aware.duration);
    console.log("UNSPECIFIED:", unaware.sequence, "Dist:", unaware.distance, "Time:", unaware.duration);
}

testDistanceVsDuration();
