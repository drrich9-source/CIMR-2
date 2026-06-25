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
  fullname?: string;
  city?: string;
  company?: string;
  job_title?: string;
  photo_url?: string;
  future_photo_url?: string;
  retirement_score?: number;
  gift_won?: string;
  created_at: Date;
}

const memoryLeads: Lead[] = [
  {
    id: 1,
    first_name: "Youssef",
    last_name: "El Alaoui",
    email: "youssef.alaoui@gmail.com",
    phone: "+212 661-234567",
    age: 34,
    score: 85,
    category: "BIEN_PREPARE",
    answers: { ageRange: "26-35 ans", situationPro: "Chef d'entreprise / Dirigeant", salaireRange: "20 000 - 40 000 DHS", connaissance: "Bien informé", epargneActuelle: "Épargne importante et structurée" },
    letter: "Bonjour Youssef,\n\nIci ton double de 65 ans. C'est fou de voir comment tes choix précoces à la tête de ton entreprise ont sécurisé notre sérénité aujourd'hui. Notre programme complémentaire avec la CIMR a tout changé !",
    created_at: new Date(Date.now() - 4 * 3600 * 1000)
  },
  {
    id: 2,
    first_name: "Fatima Zahra",
    last_name: "Benjelloun",
    email: "fz.benjelloun@outlook.com",
    phone: "+212 662-987654",
    age: 29,
    score: 55,
    category: "A_RENFORCER",
    answers: { ageRange: "26-35 ans", situationPro: "Salarié du secteur privé", salaireRange: "10 000 - 20 000 DHS", connaissance: "Vaguement / En partie", epargneActuelle: "Faible épargne occasionnelle" },
    letter: "Chère Fatima Zahra,\n\nPrends soin de toi et commence tôt. Les cotisations à la CIMR Al Moustaqbal te permettront de bâtir un futur stable et libre à ton rythme.",
    created_at: new Date(Date.now() - 12 * 3600 * 1000)
  },
  {
    id: 3,
    first_name: "Amine",
    last_name: "Tazi",
    email: "amine.tazi@techmorocco.ma",
    phone: "+212 665-432109",
    age: 24,
    score: 30,
    category: "ACTION_RECOMMANDEE",
    answers: { ageRange: "18-25 ans", situationPro: "Profession libérale / Indépendant", salaireRange: "5 000 - 10 000 DHS", connaissance: "Pas du tout", epargneActuelle: "Aucune épargne" },
    letter: "Bonjour Amine,\n\nNe t'en fais pas pour tes débuts d'activité, mais commence à épargner même de petites sommes dès aujourd'hui pour t'assurer un bel avenir.",
    created_at: new Date(Date.now() - 24 * 3600 * 1000)
  },
  {
    id: 4,
    first_name: "Nadia",
    last_name: "El Mansouri",
    email: "nadia.mansouri@finance.gov.ma",
    phone: "+212 670-112233",
    age: 41,
    score: 92,
    category: "BIEN_PREPARE",
    answers: { ageRange: "36-45 ans", situationPro: "Salarié du secteur privé", salaireRange: "20 000 - 40 000 DHS", connaissance: "Précisément", epargneActuelle: "Épargne importante et structurée" },
    letter: "Chère Nadia,\n\nFélicitations pour ta rigueur ! Tes cotisations régulières à la CIMR nous permettent aujourd'hui de profiter pleinement de notre retraite avec sérénité.",
    created_at: new Date(Date.now() - 48 * 3600 * 1000)
  },
  {
    id: 5,
    first_name: "Karim",
    last_name: "Berrada",
    email: "k.berrada@gmail.com",
    phone: "+212 651-778899",
    age: 47,
    score: 65,
    category: "A_RENFORCER",
    answers: { ageRange: "46-55 ans", situationPro: "Salarié du secteur privé", salaireRange: "10 000 - 20 000 DHS", connaissance: "Bien informé", epargneActuelle: "Épargne régulière moyenne" },
    letter: "Cher Karim,\n\nNous y sommes presque ! Il est temps de booster un peu nos versements volontaires individuels pour compenser le départ tardif et maximiser nos points.",
    created_at: new Date(Date.now() - 72 * 3600 * 1000)
  }
];
let memoryParticipantsCount = 147;
let useMemoryFallback = false;
let pool: any = null;

const memoryZoneParticipants: { [key: number]: number } = {
  1: 0, 2: 0, 3: 0, 4: 0, 5: 0
};
const memoryZoneLeads: { [key: number]: number } = {
  1: 0, 2: 0, 3: 0, 4: 0, 5: 0
};

export function getZoneIdFromLocation(location: string): number {
  if (!location) return 0;
  const loc = location.toLowerCase();
  if (loc.includes("finance") || loc.includes("nearshore")) return 1;
  if (loc.includes("zerktouni") || loc.includes("anfa") || loc.includes("racine") || loc.includes("gauthier")) return 2;
  if (loc.includes("sebaa") || loc.includes("zenata")) return 3;
  if (loc.includes("berrechid")) return 4;
  if (loc.includes("bouskoura")) return 5;
  return 0;
}

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

export async function initDb(force = false) {
  if (force) {
    useMemoryFallback = false;
    if (pool) {
      try {
        await pool.end();
      } catch (e) {
        // Ignore errors closing old pool
      }
    }
    pool = null;
    try {
      dotenv.config({ override: true });
    } catch (e) {
      console.warn("Could not reload dotenv:", e);
    }
  }

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
    
    // Create leads table (backward compatibility)
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

    // Create participants table (exactly as requested by prompt)
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS participants (
        id SERIAL PRIMARY KEY,
        fullname VARCHAR(200),
        phone VARCHAR(50),
        email VARCHAR(150),
        city VARCHAR(100),
        company VARCHAR(100),
        job_title VARCHAR(100),
        photo_url TEXT,
        future_photo_url TEXT,
        retirement_score INTEGER,
        gift_won VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create analytics table (exactly as requested by prompt)
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS analytics (
        id SERIAL PRIMARY KEY,
        participants_count INTEGER DEFAULT 0,
        qualified_leads_count INTEGER DEFAULT 0,
        conversion_rate NUMERIC DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create stats table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS cimr_stats (
        key VARCHAR(50) PRIMARY KEY,
        value INTEGER DEFAULT 0
      );
    `);

    // Insert baseline for participants if not exists
    await dbPool.query(`
      INSERT INTO cimr_stats (key, value) VALUES ('participants', 142)
      ON CONFLICT DO NOTHING;
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
  fullname?: string;
  city?: string;
  company?: string;
  jobTitle?: string;
  photoUrl?: string;
  futurePhotoUrl?: string;
  retirementScore?: number;
  giftWon?: string;
}) {
  const fullname = data.fullname || `${data.firstName} ${data.lastName}`.trim() || "Participant";
  const city = data.city || data.answers?.city || "Casablanca";
  const company = data.company || data.answers?.company || "";
  const jobTitle = data.jobTitle || data.answers?.jobTitle || data.answers?.job_title || data.answers?.job_title_option || "";
  const photoUrl = data.photoUrl || data.answers?.youngPhoto || "";
  const futurePhotoUrl = data.futurePhotoUrl || data.answers?.oldPhoto || "";
  const retirementScore = data.retirementScore !== undefined ? data.retirementScore : data.score;
  const giftWon = data.giftWon || data.answers?.giftWon || "";

  const zoneId = getZoneIdFromLocation(city);
  if (zoneId > 0) {
    memoryZoneLeads[zoneId] = (memoryZoneLeads[zoneId] || 0) + 1;
  }

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
      fullname,
      city,
      company,
      job_title: jobTitle,
      photo_url: photoUrl,
      future_photo_url: futurePhotoUrl,
      retirement_score: retirementScore,
      gift_won: giftWon,
      created_at: new Date()
    };
    memoryLeads.unshift(newLead);
    console.log(`[Memory DB] Saved participant for ${data.email} with ID: ${newLead.id}`);
    return newLead.id;
  }

  const dbPool = getDbPool();
  if (!dbPool) {
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
      fullname,
      city,
      company,
      job_title: jobTitle,
      photo_url: photoUrl,
      future_photo_url: futurePhotoUrl,
      retirement_score: retirementScore,
      gift_won: giftWon,
      created_at: new Date()
    };
    memoryLeads.unshift(newLead);
    return newLead.id;
  }

  // Increment Zone Leads in SQL Database
  if (zoneId > 0) {
    try {
      await dbPool.query(`
        INSERT INTO cimr_stats (key, value) VALUES ($1, 1)
        ON CONFLICT (key) DO UPDATE SET value = cimr_stats.value + 1;
      `, [`leads_zone_${zoneId}`]);
    } catch (zErr) {
      console.warn("Could not save zone lead in db:", zErr);
    }
  }

  // Insert in backward compatibility table first
  try {
    await dbPool.query(`
      INSERT INTO cimr_leads (first_name, last_name, email, phone, age, score, category, answers, letter)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
    `, [
      data.firstName || fullname.split(" ")[0],
      data.lastName || fullname.split(" ").slice(1).join(" "),
      data.email,
      data.phone,
      data.age,
      data.score,
      data.category,
      JSON.stringify({ ...data.answers, city, company, jobTitle, giftWon, youngPhoto: photoUrl, oldPhoto: futurePhotoUrl }),
      data.letter
    ]);
  } catch (err) {
    console.warn("Could not insert into secondary table cimr_leads:", err);
  }

  // Insert in official requested table participants
  const query = `
    INSERT INTO participants (fullname, phone, email, city, company, job_title, photo_url, future_photo_url, retirement_score, gift_won)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id;
  `;

  const values = [
    fullname,
    data.phone,
    data.email,
    city,
    company,
    jobTitle,
    photoUrl,
    futurePhotoUrl,
    retirementScore,
    giftWon
  ];

  const res = await dbPool.query(query, values);
  const participantId = res.rows[0].id;

  // Sync to analytics table as requested
  try {
    const leadsCount = await getLeadsCount();
    const participantsCount = await getParticipantsCount();
    const rate = participantsCount > 0 ? parseFloat(((leadsCount / participantsCount) * 100).toFixed(1)) : 0;
    await dbPool.query(`
      INSERT INTO analytics (participants_count, qualified_leads_count, conversion_rate)
      VALUES ($1, $2, $3);
    `, [participantsCount, leadsCount, rate]);
  } catch (err) {
    console.warn("Could not sync to analytics table:", err);
  }

  return participantId;
}

export async function getLeadsCount() {
  if (useMemoryFallback) {
    return memoryLeads.length;
  }
  
  const dbPool = getDbPool();
  if (!dbPool) return memoryLeads.length;
  
  try {
    const res = await dbPool.query("SELECT COUNT(*) FROM participants;");
    return parseInt(res.rows[0].count, 10);
  } catch (error) {
    console.error("Error fetching leads count from participants, using fallback:", error);
    try {
      const resOld = await dbPool.query("SELECT COUNT(*) FROM cimr_leads;");
      return parseInt(resOld.rows[0].count, 10);
    } catch (err) {
      return memoryLeads.length;
    }
  }
}

export async function incrementParticipants(location?: string) {
  if (location) {
    const zoneId = getZoneIdFromLocation(location);
    if (zoneId > 0) {
      memoryZoneParticipants[zoneId] = (memoryZoneParticipants[zoneId] || 0) + 1;
    }
  }

  if (useMemoryFallback) {
    memoryParticipantsCount++;
    return memoryParticipantsCount;
  }
  const dbPool = getDbPool();
  if (!dbPool) {
    memoryParticipantsCount++;
    return memoryParticipantsCount;
  }
  try {
    await dbPool.query(`
      INSERT INTO cimr_stats (key, value) VALUES ('participants', 143)
      ON CONFLICT (key) DO UPDATE SET value = cimr_stats.value + 1;
    `);

    if (location) {
      const zoneId = getZoneIdFromLocation(location);
      if (zoneId > 0) {
        try {
          await dbPool.query(`
            INSERT INTO cimr_stats (key, value) VALUES ($1, 1)
            ON CONFLICT (key) DO UPDATE SET value = cimr_stats.value + 1;
          `, [`participants_zone_${zoneId}`]);
        } catch (zErr) {
          console.warn("Could not write zone participant in db:", zErr);
        }
      }
    }

    const res = await dbPool.query("SELECT value FROM cimr_stats WHERE key = 'participants';");
    const count = res.rows[0].value;

    // Sync to analytics table as requested
    try {
      const leadsCount = await getLeadsCount();
      const rate = count > 0 ? parseFloat(((leadsCount / count) * 100).toFixed(1)) : 0;
      await dbPool.query(`
        INSERT INTO analytics (participants_count, qualified_leads_count, conversion_rate)
        VALUES ($1, $2, $3);
      `, [count, leadsCount, rate]);
    } catch (anErr) {
      console.warn("Could not sync increment to analytics:", anErr);
    }

    return count;
  } catch (error) {
    console.error("Error incrementing participants:", error);
    memoryParticipantsCount++;
    return memoryParticipantsCount;
  }
}

export async function getParticipantsCount() {
  if (useMemoryFallback) {
    return memoryParticipantsCount;
  }
  const dbPool = getDbPool();
  if (!dbPool) return memoryParticipantsCount;
  try {
    const res = await dbPool.query("SELECT value FROM cimr_stats WHERE key = 'participants';");
    if (res.rows.length > 0) {
      return res.rows[0].value;
    }
    return memoryParticipantsCount;
  } catch (error) {
    console.error("Error getting participants count:", error);
    return memoryParticipantsCount;
  }
}

export async function getAllLeads() {
  if (useMemoryFallback) {
    return memoryLeads;
  }
  
  const dbPool = getDbPool();
  if (!dbPool) return memoryLeads;
  
  try {
    const res = await dbPool.query("SELECT * FROM participants ORDER BY created_at DESC LIMIT 100;");
    // Map participants rows so they also present first_name, last_name, score, category, answers for backward compatibility
    return res.rows.map((row: any) => {
      const parts = (row.fullname || "").split(" ");
      const firstName = parts[0] || "Visiteur";
      const lastName = parts.slice(1).join(" ") || "";
      return {
        ...row,
        first_name: firstName,
        last_name: lastName,
        score: row.retirement_score !== undefined ? row.retirement_score : 55,
        category: (row.retirement_score >= 71) ? "BIEN_PREPARE" : (row.retirement_score >= 31) ? "A_RENFORCER" : "ACTION_RECOMMANDEE",
        answers: {
          ageRange: row.age ? `${row.age} ans` : "26-35 ans",
          city: row.city,
          company: row.company,
          job_title: row.job_title,
          youngPhoto: row.photo_url,
          oldPhoto: row.future_photo_url,
          giftWon: row.gift_won
        },
        letter: row.letter || ""
      };
    });
  } catch (error) {
    console.error("Error fetching leads from participants table, falling back to cimr_leads:", error);
    try {
      const resOld = await dbPool.query("SELECT * FROM cimr_leads ORDER BY created_at DESC LIMIT 100;");
      return resOld.rows;
    } catch (err) {
      console.error("All lead retrieval failed, using memory:", err);
      return memoryLeads;
    }
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

export async function getZoneStats() {
  const stats = {
    participants: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>,
    leads: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>
  };

  for (let i = 1; i <= 5; i++) {
    stats.participants[i] = memoryZoneParticipants[i] || 0;
    stats.leads[i] = memoryZoneLeads[i] || 0;
  }

  if (useMemoryFallback) {
    return stats;
  }

  const dbPool = getDbPool();
  if (!dbPool) {
    return stats;
  }

  try {
    const res = await dbPool.query(`
      SELECT key, value FROM cimr_stats 
      WHERE key LIKE 'participants_zone_%' OR key LIKE 'leads_zone_%';
    `);
    res.rows.forEach((row: any) => {
      const key = row.key;
      const val = parseInt(row.value, 10) || 0;
      if (key.startsWith("participants_zone_")) {
        const id = parseInt(key.replace("participants_zone_", ""), 10);
        if (id >= 1 && id <= 5) stats.participants[id] = val;
      } else if (key.startsWith("leads_zone_")) {
        const id = parseInt(key.replace("leads_zone_", ""), 10);
        if (id >= 1 && id <= 5) stats.leads[id] = val;
      }
    });
    return stats;
  } catch (err) {
    console.error("Error fetching zone stats, using memory fallback:", err);
    return stats;
  }
}


