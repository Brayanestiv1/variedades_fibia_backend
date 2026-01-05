import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import * as fs from "fs";
import * as path from "path";
import { DatabaseConfig } from "./config";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

let db: SqlJsDatabase | null = null;
let dbPath: string;

export async function initializeSQLite(config: DatabaseConfig) {
  // Try to use local sql.js files first, fallback to CDN
  const sqlJsPath = path.join(__dirname, "../../node_modules/sql.js/dist/sql-wasm.wasm");
  const SQL = await initSqlJs({
    locateFile: (file: string) => {
      if (file.endsWith(".wasm") && fs.existsSync(sqlJsPath)) {
        return sqlJsPath;
      }
      return `https://sql.js.org/dist/${file}`;
    },
  });

  dbPath = config.path || path.join(__dirname, "../../database.sqlite");

  // Load existing database or create new one
  try {
    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath);
      db = new SQL.Database(buffer);
      console.log("✅ SQLite database loaded from file");
    } else {
      db = new SQL.Database();
      console.log("✅ New SQLite database created");
    }
  } catch (error) {
    db = new SQL.Database();
    console.log("✅ New SQLite database created (file read error)");
  }

  // Enable foreign keys
  db.run("PRAGMA foreign_keys = ON");

  // Initialize database tables
  await createTables();
  
  // Create default admin user
  await createDefaultUser();

  // Save database to file
  saveDatabase();

  return getSQLiteDatabase(db);
}

async function createTables() {
  // Users table
  db!.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Products table
  db!.run(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0 CHECK(quantity >= 0),
      min_threshold INTEGER NOT NULL DEFAULT 0 CHECK(min_threshold >= 0),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Inventory exits table
  db!.run(`
    CREATE TABLE IF NOT EXISTS inventory_exits (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      previous_quantity INTEGER NOT NULL,
      new_quantity INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create indexes
  db!.run(`
    CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
    CREATE INDEX IF NOT EXISTS idx_inventory_exits_product_id ON inventory_exits(product_id);
  `);
}

async function createDefaultUser() {
  const adminCheck = db!.exec("SELECT id FROM users WHERE username = 'fibiadmin'");
  if (adminCheck.length === 0 || adminCheck[0].values.length === 0) {
    const hashedPassword = bcrypt.hashSync("fibi2026", 10);
    const userId = uuidv4();
    db!.run(
      "INSERT INTO users (id, username, password) VALUES (?, ?, ?)",
      [userId, "fibiadmin", hashedPassword]
    );
    console.log("✅ Default admin user created (username: fibiadmin, password: fibi2026)");
    saveDatabase();
  }
}

function saveDatabase() {
  if (db && dbPath) {
    try {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbPath, buffer);
    } catch (error) {
      console.error("Error saving database:", error);
    }
  }
}

// SQLite Database wrapper
class SQLiteDatabase {
  private db: SqlJsDatabase;

  constructor(database: SqlJsDatabase) {
    this.db = database;
  }

  pragma(setting: string) {
    this.db.run(`PRAGMA ${setting}`);
  }

  exec(sql: string) {
    this.db.run(sql);
    saveDatabase();
  }

  prepare(sql: string) {
    return new SQLiteStatement(this.db, sql);
  }
}

class SQLiteStatement {
  private db: SqlJsDatabase;
  private sql: string;

  constructor(db: SqlJsDatabase, sql: string) {
    this.db = db;
    this.sql = sql;
  }

  run(...params: any[]) {
    const stmt = this.db.prepare(this.sql);
    stmt.bind(params);
    stmt.step();
    stmt.free();
    saveDatabase();
  }

  get(...params: any[]): any {
    const stmt = this.db.prepare(this.sql);
    stmt.bind(params);
    const result = stmt.step();
    if (!result) {
      stmt.free();
      return undefined;
    }
    const row: any = {};
    const columns = stmt.getColumnNames();
    const values = stmt.get();
    columns.forEach((col: string, index: number) => {
      row[col] = values[index];
    });
    stmt.free();
    return row;
  }

  all(...params: any[]): any[] {
    const stmt = this.db.prepare(this.sql);
    stmt.bind(params);
    const rows: any[] = [];
    while (stmt.step()) {
      const row: any = {};
      const columns = stmt.getColumnNames();
      const values = stmt.get();
      columns.forEach((col: string, index: number) => {
        row[col] = values[index];
      });
      rows.push(row);
    }
    stmt.free();
    return rows;
  }
}

export function getSQLiteDatabase(database: SqlJsDatabase) {
  return new SQLiteDatabase(database);
}

