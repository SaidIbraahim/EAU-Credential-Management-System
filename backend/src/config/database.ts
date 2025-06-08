import { Pool } from 'pg';
import { config } from 'dotenv';

config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_gJ5uoeYsh4aF@ep-bold-recipe-a1p5gxbx-pooler.ap-southeast-1.aws.neon.tech/eau_credentail_db?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

export default pool; 