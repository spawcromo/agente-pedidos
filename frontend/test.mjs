import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  const res = await supabase.from('profiles').select('id, full_name, phone, email, created_at, driver_status, delivery_routes(id, delivery_date)').eq('role', 'repartidor')
  console.log(JSON.stringify(res, null, 2))
}
run()
