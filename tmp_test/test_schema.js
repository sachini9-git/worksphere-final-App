const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function addColumn() {
    // We can't run raw DDL (ALTER TABLE) through the standard Javascript client without a stored procedure (RPC).
    // Let's check if we can insert a dummy task with scheduled_date. If it exists it will work, if not it will throw an error.
    console.log("Checking for scheduled_date column...");
    const { error } = await supabase.from('tasks').select('scheduled_date').limit(1);
    
    if (error && error.code === '42703') {
        console.log("Column 'scheduled_date' does NOT exist.");
        console.log("WAIT - Since we don't have direct SQL access through the public Anon Key, we will need to store this data in the existing 'description' JSON string or ask the user to add the column in their dashboard.");
    } else if (error) {
        console.log("Error checking column:", error);
    } else {
        console.log("Column 'scheduled_date' exists!");
    }
}

addColumn();
