import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function addVideoColumns() {
  console.log('Adding video columns to site_media table...');
  
  try {
    // Add intro_video_urls column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE site_media 
      ADD COLUMN IF NOT EXISTS intro_video_urls TEXT
    `);
    console.log('✓ Added intro_video_urls column');
    
    // Add intro_video_poster column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE site_media 
      ADD COLUMN IF NOT EXISTS intro_video_poster TEXT
    `);
    console.log('✓ Added intro_video_poster column');
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
    // If ALTER TABLE fails, the columns might already exist or there's another issue
    console.log('Columns may already exist or there was an error.');
  }
  
  process.exit(0);
}

addVideoColumns();