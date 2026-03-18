import fetch from 'node-fetch';
import 'dotenv/config';

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

const origin = 'Tropero Sosa 4614, M5513 Coquimbito, Mendoza, Argentina';
const dests = [
  'Chile 450, M5500HFC Mendoza',
  'San Martín 450, Maipú, Mendoza',
  'Av. Emilio Civit 300, M5500CWI Mendoza',
  'Belgrano 890, M5539GEP Las Heras, Mendoza',
  'Paso de los Andes 200, M5501 Godoy Cruz, Mendoza',
  'Colón 1200, M5504FWA Godoy Cruz, Mendoza'
];

async function greedy() {
    const sanitize = (addr) => addr.toLowerCase().includes('mendoza') ? addr : `${addr}, Mendoza, Argentina`;
    const remaining = dests.map((address, index) => ({ 
        address: sanitize(address), 
        originalIndex: index 
    }));

    const optimizedIndices = [];
    let currentPoint = sanitize(origin);

    while (remaining.length > 0) {
        const destString = remaining.map(r => encodeURIComponent(r.address)).join('|');
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(currentPoint)}&destinations=${destString}&key=${apiKey}`;
        
        const res = await fetch(url);
        const data = await res.json();

        const elements = data.rows[0].elements;
        let closestIdx = -1;
        let minDuration = Infinity;

        elements.forEach((el, idx) => {
            if (el.status === 'OK' && el.duration.value < minDuration) {
                minDuration = el.duration.value;
                closestIdx = idx;
            }
        });

        if (closestIdx === -1) {
            remaining.forEach(r => optimizedIndices.push(r.originalIndex));
            break;
        }

        const winner = remaining[closestIdx];
        optimizedIndices.push(winner.originalIndex);
        currentPoint = winner.address;
        remaining.splice(closestIdx, 1);
    }
    
    console.log('[GreedyOptimize] Final Sequence:', optimizedIndices);
}

greedy();
