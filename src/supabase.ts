const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL;
const anon = process.env.SUPABASE_ANON_KEY;

if (!url || !anon) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
}

console.log('[supabase] using', new URL(url).host);
const client = createClient(url, anon);
module.exports = client;
