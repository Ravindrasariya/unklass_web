import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

import { Pool } from "pg";

// Disable SSL certificate validation for Neon PostgreSQL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export const db = drizzle(pool, { schema });
