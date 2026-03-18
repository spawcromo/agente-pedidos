import fetch from 'node-fetch';
import 'dotenv/config';

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

const origin = 'Tropero Sosa 4614, M5513 Coquimbito, Mendoza, Argentina';
const dests = [
  'San Martin 450, M5515 Maipú, Mendoza',
  'Paso de los Andes 200, Dorrego, Guaymallén, Mendoza'
];

async function testMatrixV2() {
    const url = 'https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix';
    const body = {
        origins: [{ waypoint: { address: origin } }, { waypoint: { address: dests[0] } }],
        destinations: [{ waypoint: { address: dests[0] } }, { waypoint: { address: dests[1] } }],
        travelMode: "DRIVE",
        routingPreference: "ROUTING_PREFERENCE_UNSPECIFIED"
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'originIndex,destinationIndex,distanceMeters'
        },
        body: JSON.stringify(body)
    });

    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));
}

testMatrixV2();
