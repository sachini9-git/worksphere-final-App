const { createClient } = require('@supabase/supabase-js');
const dt = require('date-fns');

// Add to your current env later
const supabaseUrl = process.env.VITE_SUPABASE_URL; // We will extract this
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log(supabaseUrl, supabaseAnonKey);
