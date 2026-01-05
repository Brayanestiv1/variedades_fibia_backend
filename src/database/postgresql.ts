import type { Pool } from "pg";
import { DatabaseConfig } from "./config";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

let connection: Pool | null = null;

export async function initializePostgreSQL(config: DatabaseConfig) {
  // Dynamic import to avoid loading if not needed
  const pg = await import("pg");
  const pool = new pg.Pool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Test connection
  try {
    await pool.query("SELECT 1");
    console.log("✅ Connected to PostgreSQL database");
    connection = pool;
  } catch (error) {
    console.error("❌ Failed to connect to PostgreSQL:", error);
    throw error;
  }

  // Create tables
  await createTables(pool);
  
  // Create default admin user
  await createDefaultUser(pool);

  return pool;
}

async function createTables(pool: Pool) {
  // Users table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Products table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(50) NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0 CHECK(quantity >= 0),
      min_threshold INTEGER NOT NULL DEFAULT 0 CHECK(min_threshold >= 0),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create indexes
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
  `);

  // Inventory exits table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory_exits (
      id VARCHAR(36) PRIMARY KEY,
      product_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      previous_quantity INTEGER NOT NULL,
      new_quantity INTEGER NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_inventory_exits_product_id ON inventory_exits(product_id);
  `);

  console.log("✅ PostgreSQL tables created/verified");
}

async function createDefaultUser(pool: Pool) {
  const result = await pool.query(
    "SELECT id FROM users WHERE username = $1",
    ["fibiadmin"]
  );

  if (result.rows.length === 0) {
    const userId = uuidv4();
    const hashedPassword = bcrypt.hashSync("fibi2026", 10);
    await pool.query(
      "INSERT INTO users (id, username, password) VALUES ($1, $2, $3)",
      [userId, "fibiadmin", hashedPassword]
    );
    console.log("✅ Default admin user created (username: fibiadmin, password: fibi2026)");
  }
}

// PostgreSQL Database wrapper with better-sqlite3-like API
class PostgreSQLDatabase {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  pragma(setting: string) {
    // PostgreSQL doesn't use PRAGMA
    console.warn("PRAGMA not supported in PostgreSQL:", setting);
  }

  exec(sql: string) {
    return this.pool.query(sql);
  }

  prepare(sql: string) {
    return new PostgreSQLStatement(this.pool, sql);
  }
}

class PostgreSQLStatement {
  private pool: Pool;
  private sql: string;

  constructor(pool: Pool, sql: string) {
    this.pool = pool;
    // Convert ? placeholders to $1, $2, etc. for PostgreSQL
    this.sql = this.convertPlaceholders(sql);
  }

  private convertPlaceholders(sql: string): string {
    let paramIndex = 1;
    return sql.replace(/\?/g, () => `$${paramIndex++}`);
  }

  async run(...params: any[]) {
    await this.pool.query(this.sql, params);
  }

  async get(...params: any[]): Promise<any> {
    const result = await this.pool.query(this.sql, params);
    if (result.rows.length === 0) {
      return undefined;
    }
    return result.rows[0];
  }

  async all(...params: any[]): Promise<any[]> {
    const result = await this.pool.query(this.sql, params);
    return result.rows;
  }
}

export function getPostgreSQLDatabase(pool: Pool) {
  return new PostgreSQLDatabase(pool);
}

