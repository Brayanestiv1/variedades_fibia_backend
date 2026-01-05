import type { Pool } from "mysql2/promise";
import { DatabaseConfig } from "./config";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

let connection: Pool | null = null;

export async function initializeMySQL(config: DatabaseConfig) {
  // Dynamic import to avoid loading if not needed
  // mysql2/promise is a namespace import
  const mysqlModule = await import("mysql2/promise");
  // Handle both default and named exports
  const mysql = (mysqlModule as any).default || mysqlModule;
  const pool = mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  // Test connection
  try {
    await pool.query("SELECT 1");
    console.log("✅ Connected to MySQL database");
    connection = pool;
  } catch (error) {
    console.error("❌ Failed to connect to MySQL:", error);
    throw error;
  }

  // Create tables
  await createTables(pool);
  
  // Create default admin user
  await createDefaultUser(pool);

  return pool;
}

async function createTables(pool: mysql.Pool) {
  // Users table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
      quantity INT NOT NULL DEFAULT 0 CHECK(quantity >= 0),
      min_threshold INT NOT NULL DEFAULT 0 CHECK(min_threshold >= 0),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_products_user_id (user_id),
      INDEX idx_products_category (category),
      INDEX idx_products_name (name)
    )
  `);

  // Inventory exits table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory_exits (
      id VARCHAR(36) PRIMARY KEY,
      product_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      quantity INT NOT NULL CHECK(quantity > 0),
      previous_quantity INT NOT NULL,
      new_quantity INT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_inventory_exits_product_id (product_id)
    )
  `);

  console.log("✅ MySQL tables created/verified");
}

async function createDefaultUser(pool: mysql.Pool) {
  const [rows] = await pool.query(
    "SELECT id FROM users WHERE username = ?",
    ["fibiadmin"]
  ) as any[];

  if (rows.length === 0) {
    const userId = uuidv4();
    const hashedPassword = bcrypt.hashSync("fibi2026", 10);
    await pool.query(
      "INSERT INTO users (id, username, password) VALUES (?, ?, ?)",
      [userId, "fibiadmin", hashedPassword]
    );
    console.log("✅ Default admin user created (username: fibiadmin, password: fibi2026)");
  }
}

// MySQL Database wrapper with better-sqlite3-like API
class MySQLDatabase {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  pragma(setting: string) {
    // MySQL doesn't use PRAGMA, but we'll handle it gracefully
    console.warn("PRAGMA not supported in MySQL:", setting);
  }

  exec(sql: string) {
    // For exec, we'll just run the query
    return this.pool.query(sql);
  }

  prepare(sql: string) {
    return new MySQLStatement(this.pool, sql);
  }
}

class MySQLStatement {
  private pool: Pool;
  private sql: string;

  constructor(pool: Pool, sql: string) {
    this.pool = pool;
    this.sql = sql;
  }

  async run(...params: any[]) {
    await this.pool.query(this.sql, params);
  }

  async get(...params: any[]): Promise<any> {
    const [rows] = await this.pool.query(this.sql, params) as any[];
    if (rows.length === 0) {
      return undefined;
    }
    return rows[0];
  }

  async all(...params: any[]): Promise<any[]> {
    const [rows] = await this.pool.query(this.sql, params) as any[];
    return rows;
  }
}

export function getMySQLDatabase(pool: mysql.Pool) {
  return new MySQLDatabase(pool);
}

