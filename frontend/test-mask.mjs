import fetch from 'node-fetch';
import 'dotenv/config';

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

const origin = 'Tropero Sosa 4614, M5513 Coquimbito, Mendoza, Argentina';
const dests = [
  'San Martin 450, Ciudad, Mendoza',
  'Paso de los Andes 200, Dorrego, Guaymallén'
];

async function testRoutesApi() {
    const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';
    const body = {
        origin: { address: origin },
        destination: { address: origin },
        intermediates: dests.map(d => ({ address: d })),
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
        optimizeWaypointOrder: true
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'routes.optimizedIntermediateWaypointIndex,error'
        },
        body: JSON.stringify(body)
    });

    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));
}

testRoutesApi();
