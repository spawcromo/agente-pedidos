import fetch from 'node-fetch';
import 'dotenv/config';

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

const origin = 'Tropero Sosa 4614, M5513 Coquimbito, Mendoza, Argentina';
const dests = [
  'San Martin 450, M5515 Maipú, Mendoza', // 0
  'Paso de los Andes 200, Dorrego, Guaymallén, Mendoza', // 1
  'Emilio Civit 300, Ciudad de Mendoza, Mendoza', // 2
  'Av. San Martín Sur 1200, Godoy Cruz, Mendoza', // 3
  'Dr. Moreno 1100, Las Heras, Mendoza', // 4
  'Chile 450, San José, Guaymallén, Mendoza' // 5
];

async function compareSequences() {
    const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';
    
    // Google's choice: [0, 5, 3, 1, 2, 4]
    // Human choice: [0, 3, 1, 5, 2, 4]
    
    const getDuration = async (seq) => {
        const body = {
            origin: { address: origin },
            destination: { address: dests[seq[seq.length - 1]] },
            intermediates: seq.slice(0, seq.length - 1).map(idx => ({ address: dests[idx] })),
            travelMode: "DRIVE",
            routingPreference: "ROUTING_PREFERENCE_UNSPECIFIED"
        };
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters'
            },
            body: JSON.stringify(body)
        });
        const d = await res.json();
        return d.routes[0];
    };

    const google = await getDuration([0, 5, 3, 1, 2, 4]);
    const human = await getDuration([0, 3, 1, 5, 2, 4]);

    console.log("GOOGLE:", google.distanceMeters, "m /", google.duration);
    console.log("HUMAN :", human.distanceMeters, "m /", human.duration);
}

compareSequences();
