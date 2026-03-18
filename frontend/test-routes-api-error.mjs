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

    const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';
    const body = {
        origin: { address: safeOrigin },
        destination: { address: safeOrigin },
        intermediates: safeDests.map(d => ({ address: d })),
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
        optimizeWaypointOrder: true
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            // 'X-Goog-FieldMask': 'routes.optimizedIntermediateWaypointIndex,error'
            'X-Goog-FieldMask': '*' // get all error details
        },
        body: JSON.stringify(body)
    });

    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));
}

testRoutesApi();
