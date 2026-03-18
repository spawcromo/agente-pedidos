import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const newAddresses = [
  { name: 'Carnicería Don Pedro', address: 'San Martin 450, M5515 Maipú, Mendoza' }, // Defined perfectly as Maipu
  { name: 'Almacén El Vecino', address: 'Paso de los Andes 200, Dorrego, Guaymallén, Mendoza' },
  { name: 'Restaurant Don Julio', address: 'Emilio Civit 300, Ciudad de Mendoza, Mendoza' },
  { name: 'Supermercado El Ángel', address: 'Av. San Martín Sur 1200, Godoy Cruz, Mendoza' }, // Clarified
  { name: 'Rotisería La Abuela', address: 'Dr. Moreno 1100, Las Heras, Mendoza' }, // Clarified
  { name: 'Granja Feliz', address: 'Chile 450, San José, Guaymallén, Mendoza' }
];

async function updateClients() {
    console.log('Fetching clients...');
    const { data: clients, error: fetchErr } = await supabase.from('clients').select('id, name, address');
    
    if (fetchErr) {
        console.error('Fetch error:', fetchErr);
        return;
    }

    console.log('Current clients:', clients);

    for (const client of clients) {
        const match = newAddresses.find(na => na.name === client.name);
        if (match) {
            const { error: updateErr } = await supabase.from('clients').update({ address: match.address }).eq('id', client.id);
            if (updateErr) {
                console.error(`Failed to update ${client.name}:`, updateErr);
            } else {
                console.log(`Updated ${client.name} -> ${match.address}`);
            }
        }
    }
    
    console.log('Done.');
}

updateClients();
