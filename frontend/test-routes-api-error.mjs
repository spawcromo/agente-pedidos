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

async function testRoutesApi() {
    const sanitize = (addr) => addr.toLowerCase().includes('mendoza') ? addr : `${addr}, Mendoza, Argentina`;
    const safeOrigin = sanitize(origin);
    const safeDests = dests.map(sanitize);

    console.log("TESTING WITH LOOP (DEST = ORIGIN)");
    let url = 'https://routes.googleapis.com/directions/v2:computeRoutes';
    let body = {
        origin: { address: safeOrigin },
        destination: { address: safeOrigin },
        intermediates: safeDests.map(d => ({ address: d })),
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
        optimizeWaypointOrder: true
    };

    let res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'routes.optimizedIntermediateWaypointIndex'
        },
        body: JSON.stringify(body)
    });

    let data = await res.json();
    console.log("LOOP ORDER:", data.routes[0].optimizedIntermediateWaypointIndex);

    console.log("TESTING WITH NO LOOP (Last stop in array as dest)");
    const lastStop = safeDests[safeDests.length - 1];
    const intermediates = safeDests.slice(0, safeDests.length - 1);
    
    body = {
        origin: { address: safeOrigin },
        destination: { address: lastStop },
        intermediates: intermediates.map(d => ({ address: d })),
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
        optimizeWaypointOrder: true
    };

    res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'routes.optimizedIntermediateWaypointIndex'
        },
        body: JSON.stringify(body)
    });

    data = await res.json();
    console.log("NO LOOP (Ending at Chile 450) ORDER:", data.routes[0].optimizedIntermediateWaypointIndex);
}

testRoutesApi();
