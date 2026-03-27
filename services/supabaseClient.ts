import { createClient } from '@supabase/supabase-js';

// Use Vite environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("Missing Supabase credentials in .env file.");
}

export const supabase = createClient(
    SUPABASE_URL || 'http://localhost:54321',
    SUPABASE_ANON_KEY || 'public-anon-key'
);

export const isMockMode = false;

console.log("Supabase Status:", isMockMode ? "Mock Mode (No Keys)" : "Connected");
