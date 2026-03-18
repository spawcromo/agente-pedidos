import fetch from 'node-fetch';
import 'dotenv/config';

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

const origin = 'Tropero Sosa 4614, M5515 Mendoza, Argentina';
const dests = [
  'Chile 450, M5500HFC Mendoza, Argentina',
  'San Martín 450, Maipú, Mendoza, Argentina',
  'Av. Emilio Civit 300, M5500CWI Mendoza, Argentina',
  'Belgrano 890, M5539GEP Las Heras, Mendoza, Argentina',
  'Paso de los Andes 200, M5501 Godoy Cruz, Mendoza, Argentina',
  'Colón 1200, M5504FWA Godoy Cruz, Mendoza, Argentina'
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
            'X-Goog-FieldMask': 'routes.optimizedIntermediateWaypointIndex,routes.duration'
        },
        body: JSON.stringify(body)
    });

    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));

    if (data.routes && data.routes.length > 0) {
        console.log("Optimized indices:", data.routes[0].optimizedIntermediateWaypointIndex);
    }
}

testRoutesApi();
