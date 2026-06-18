import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

// Recurse of env templates (e.g. ${{POSTGRES_USER}} or ${{RAILWAY_PRIVATE_DOMAIN}})
function expandEnvValue(val: string | undefined): string {
  if (!val) return "";
  let resolved = val;
  const regex = /\$\{\{?([^}]+)\}?\}/g;
  let matchesFound = true;
  let iterations = 0;
  
  while (matchesFound && iterations < 5) {
    matchesFound = false;
    const current = resolved;
    resolved = current.replace(regex, (match, p1) => {
      const key = p1.trim();
      const envVal = process.env[key];
      if (envVal !== undefined) {
        matchesFound = true;
        return envVal;
      }
      return match;
    });
    if (resolved === current) {
      break;
    }
    iterations++;
  }
  return resolved;
}

interface Lead {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  age: number;
  score: number;
  category: string;
  answers: any;
  letter: string;
  created_at: Date;
}

const memoryLeads: Lead[] = [];
let useMemoryFallback = false;
let pool: any = null;

export function getDbPool() {
  if (useMemoryFallback) {
    return null;
  }
  
  if (!pool) {
    let connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.warn("💡 DATABASE_URL is not defined in process.env. Falling back to robust in-memory storage.");
      useMemoryFallback = true;
      return null;
    }

    // Resolve Railway templates like ${{PGUSER}} etc.
    connectionString = expandEnvValue(connectionString);

    if (connectionString.includes("${{") || connectionString.includes("${")) {
      console.warn(
        "⚠️ DATABASE_URL contains unresolved placeholders (e.g. ${{RAILWAY_TCP_PROXY_DOMAIN}}). " +
        "Using convenient in-memory storage instead."
      );
      useMemoryFallback = true;
      return null;
    }

    if (connectionString.includes("railway.internal")) {
      console.warn(
        "💡 Private Railway network address detected. Since the applet preview is not running inside " +
        "Railway private network, we will prioritize public TCP proxy or fallback with in-memory mode if unreachable."
      );
    }

    try {
      pool = new Pool({
        connectionString,
        ssl: {
          rejectUnauthorized: false
        },
        connectionTimeoutMillis: 4000 // Fails fast to prevent server blocking
      });

      pool.on("error", (err: Error) => {
        console.error("Unexpected error on idle PostgreSQL client:", err);
      });
    } catch (e) {
      console.error("Failed to construct PG Pool:", e);
      useMemoryFallback = true;
      return null;
    }
  }
  return pool;
}

export async function initDb() {
  if (useMemoryFallback) {
    console.log("ℹ️ In-memory mode is active. Persistent leads will run in RAM for this session.");
    return false;
  }

  const dbPool = getDbPool();
  if (!dbPool) {
    useMemoryFallback = true;
    return false;
  }

  try {
    console.log("Testing PostgreSQL database connection...");
    
    // Quick test to confirm host is reachable and DNS is up
    const client = await dbPool.connect();
    client.release();

    console.log("Connected to PostgreSQL! Creating tables if they don't exist...");
    
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
    
    console.log("Database tables initialized successfully. Real database is active!");
    return true;
  } catch (error: any) {
    console.warn(
      "\n⚠️ DATABASE CONNECTION WARNING:\n" +
      `Could not connect to database: ${error.message || error}\n` +
      "The applet preview is now running smoothly in-memory. Submissions will work and show up in the history panel!\n" +
      "To connect a real PostgreSQL DB, make sure your DATABASE_URL in .env uses a publicly reachable host (such as the Railway public URL or Supabase IP).\n"
    );
    useMemoryFallback = true;
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
  if (useMemoryFallback) {
    const newLead: Lead = {
      id: memoryLeads.length + 1,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone,
      age: data.age,
      score: data.score,
      category: data.category,
      answers: data.answers,
      letter: data.letter,
      created_at: new Date()
    };
    memoryLeads.unshift(newLead);
    console.log(`[Memory DB] Saved lead for ${data.email} with ID: ${newLead.id}`);
    return newLead.id;
  }

  const dbPool = getDbPool();
  if (!dbPool) {
    // Save to memory fallback
    const newLead: Lead = {
      id: memoryLeads.length + 1,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone,
      age: data.age,
      score: data.score,
      category: data.category,
      answers: data.answers,
      letter: data.letter,
      created_at: new Date()
    };
    memoryLeads.unshift(newLead);
    return newLead.id;
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
  if (useMemoryFallback) {
    return memoryLeads.length;
  }
  
  const dbPool = getDbPool();
  if (!dbPool) return memoryLeads.length;
  
  try {
    const res = await dbPool.query("SELECT COUNT(*) FROM cimr_leads;");
    return parseInt(res.rows[0].count, 10);
  } catch (error) {
    console.error("Error fetching leads count, using memory fallback instead:", error);
    return memoryLeads.length;
  }
}

export async function getAllLeads() {
  if (useMemoryFallback) {
    return memoryLeads;
  }
  
  const dbPool = getDbPool();
  if (!dbPool) return memoryLeads;
  
  try {
    const res = await dbPool.query("SELECT * FROM cimr_leads ORDER BY created_at DESC LIMIT 100;");
    return res.rows;
  } catch (error) {
    console.error("Error fetching leads, returning memory fallback instead:", error);
    return memoryLeads;
  }
}

export function getDbStatus() {
  const connStr = process.env.DATABASE_URL || "";
  let host = "In-memory Fallback";
  
  if (!useMemoryFallback && connStr) {
    // Extract host from connection string for display if present
    const match = connStr.match(/@([^:/]+)/);
    if (match && match[1]) {
      host = match[1];
    } else {
      host = "Remote PostgreSQL";
    }
  }

  return {
    connected: !useMemoryFallback,
    fallback: useMemoryFallback,
    host: host,
    totalCount: memoryLeads.length
  };
}


