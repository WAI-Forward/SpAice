async function getDbPool() {
  if (!dbPoolPromise) {
    dbPoolPromise = createDbPool();
  }

  return dbPoolPromise;
}

async function createDbPool() {
  const connectionString = readDatabaseAddress();

  if (!connectionString) {
    console.warn("Clusternauts persistence is using memory: no database address found.");
    return null;
  }

  try {
    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString,
      max: 8,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3000
    });
    await pool.query("SELECT 1");
    console.log("Clusternauts persistence connected to PostgreSQL.");
    return pool;
  } catch (error) {
    console.warn(
      `Clusternauts persistence is using memory: ${error instanceof Error ? error.message : "PostgreSQL unavailable."}`
    );
    return null;
  }
}

function readDatabaseAddress() {
  if (process.env.CLUSTERNAUTS_DATABASE_URL || process.env.DATABASE_URL) {
    return normalizeDatabaseAddress(
      databaseAddressFromConfigValue(
        process.env.CLUSTERNAUTS_DATABASE_URL || process.env.DATABASE_URL,
        "Clusternauts database environment variable"
      )
    );
  }

  const configPath = path.join(root, "data", "db-uri.json");

  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return normalizeDatabaseAddress(selectDatabaseAddress(config));
  } catch (error) {
    console.warn(`Could not read database config: ${error instanceof Error ? error.message : "invalid JSON"}`);
    return null;
  }
}

function databaseAddressFromConfigValue(value, source) {
  const raw = String(value || "").trim();
  if (!raw) {
    return null;
  }
  if (!raw.startsWith("{")) {
    return raw;
  }

  try {
    return selectDatabaseAddress(JSON.parse(raw));
  } catch (error) {
    console.warn(`Could not read ${source}: ${error instanceof Error ? error.message : "invalid JSON"}`);
    return null;
  }
}

function selectDatabaseAddress(config) {
  if (!config || typeof config !== "object") {
    return null;
  }

  const devAddress = typeof config.dev_address === "string" ? config.dev_address.trim() : "";
  const prodAddress = typeof config.prod_address === "string" ? config.prod_address.trim() : "";
  const useProd = process.env.CLUSTERNAUTS_DB_TARGET === "prod" || process.env.NODE_ENV === "production";
  return useProd ? prodAddress || devAddress : devAddress || prodAddress;
}

function normalizeDatabaseAddress(address) {
  if (typeof address !== "string" || !address.trim()) {
    return null;
  }

  return address.trim().replace(/^postgresql\+psycopg2:\/\//, "postgresql://").replace(/ /g, "%20");
}

async function ensureDatabaseSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clusternauts_world_state (
      id text PRIMARY KEY,
      state jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clusternauts_player_state (
      player_id text PRIMARY KEY,
      state jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clusternauts_player_profile (
      player_id text PRIMARY KEY,
      state jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clusternauts_leaderboard_entry (
      id text PRIMARY KEY,
      player_id text NOT NULL,
      score double precision NOT NULL,
      state jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clusternauts_account (
      username text PRIMARY KEY,
      state jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clusternauts_account_session (
      token_hash text PRIMARY KEY,
      username text NOT NULL,
      state jsonb NOT NULL,
      expires_at timestamptz NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clusternauts_account_save (
      id text PRIMARY KEY,
      username text NOT NULL,
      name text NOT NULL,
      state jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clusternauts_shared_world_state (
      id text PRIMARY KEY,
      state jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clusternauts_shared_player_state (
      world_id text NOT NULL,
      player_id text NOT NULL,
      state jsonb NOT NULL,
      team_id text NOT NULL DEFAULT '',
      updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (world_id, player_id)
    )
  `);
}

