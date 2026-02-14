import postgres from 'postgres';

const connectionString = "postgresql://postgres:Orgobloom%402025@db.wfmmdkknrigkhdpldwhc.supabase.co:5432/postgres";
const sql = postgres(connectionString);

async function addMissingColumns() {
  try {
    console.log("Adding missing columns to users table...");
    
    // Add fraud detection columns
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0 NOT NULL`;
    console.log("✓ risk_score column added");
    
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS fraud_status VARCHAR DEFAULT 'SAFE' NOT NULL`;
    console.log("✓ fraud_status column added");
   
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS cod_enabled BOOLEAN DEFAULT true NOT NULL`;
    console.log("✓ cod_enabled column added");
    
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_ip_address TEXT`;
    console.log("✓ last_ip_address column added");
    
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS device_fingerprint TEXT`;
    console.log("✓ device_fingerprint column added");
    
    // Verify columns exist
    const columns = await sql`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `;
    
    console.log("\n✅ Users table columns:");
    columns.forEach(col => console.log(`  - ${col.column_name}: ${col.data_type}`));
    
  } catch (error: any) {
    console.error("Error adding columns:", error.message);
  } finally {
    await sql.end();
  }
}

addMissingColumns();
