const { Client } = require('pg');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = env.match(/DATABASE_URL=(.*)/);

async function run() {
    if (!dbUrlMatch) {
       console.log("No DATABASE_URL found");
       return;
    }
    const connectionString = dbUrlMatch[1].trim().replace('"', '').replace('"', '');
    const client = new Client({ connectionString });
    await client.connect();

    const res = await client.query(`
        SELECT proname, prosrc 
        FROM pg_proc 
        JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid 
        WHERE pg_namespace.nspname = 'public' AND proname='last_activity';
    `);
    
    console.log(res.rows[0]?.prosrc || "Function not found");
    await client.end();
}
run().catch(console.error);
