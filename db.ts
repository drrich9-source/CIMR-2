import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

let pool: any = null;

export function getDbPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.warn("WARNING: DATABASE_URL is not defined. Database storage is disabled.");
      return null;
    }

    // Since we're connecting to Prisma/Heroku/Supabase PostgreSQL databases, we configurationally enable SSL by default
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });

    pool.on("error", (err: Error) => {
      console.error("Unexpected error on idle PostgreSQL client:", err);
    });
  }
  return pool;
}

export async function initDb() {
  const dbPool = getDbPool();
  if (!dbPool) return false;

  try {
    console.log("Initializing PostgreSQL database...");
    
    // Create leads table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS cimr_leads (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        email VARCHAR(150),
        phone VARCHAR(50),
        age INTEGER,
        score INTEGER,
        category VARCHAR(50),
        answers JSONB,
        letter TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log("Database tables initialized successfully.");
    return true;
  } catch (error) {
    console.error("Failed to initialize database tables:", error);
    return false;
  }
}

export async function insertLead(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age: number;
  score: number;
  category: string;
  answers: any;
  letter: string;
}) {
  const dbPool = getDbPool();
  if (!dbPool) {
    throw new Error("Database is not connected.");
  }

  const query = `
    INSERT INTO cimr_leads (first_name, last_name, email, phone, age, score, category, answers, letter)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id;
  `;

  const values = [
    data.firstName,
    data.lastName,
    data.email,
    data.phone,
    data.age,
    data.score,
    data.category,
    JSON.stringify(data.answers),
    data.letter
  ];

  const res = await dbPool.query(query, values);
  return res.rows[0].id;
}

export async function getLeadsCount() {
  const dbPool = getDbPool();
  if (!dbPool) return 0;
  
  try {
    const res = await dbPool.query("SELECT COUNT(*) FROM cimr_leads;");
    return parseInt(res.rows[0].count, 10);
  } catch (error) {
    console.error("Error fetching leads count:", error);
    return 0;
  }
}

export async function getAllLeads() {
  const dbPool = getDbPool();
  if (!dbPool) return [];
  
  try {
    const res = await dbPool.query("SELECT * FROM cimr_leads ORDER BY created_at DESC LIMIT 100;");
    return res.rows;
  } catch (error) {
    console.error("Error fetching leads:", error);
    return [];
  }
}
