import { getDatabaseConfig } from "./config";
import { initializeSQLite, getSQLiteDatabase } from "./sqlite";

let dbInstance: any = null;
let dbType: 'sqlite' | 'mysql' | 'postgresql' = 'sqlite';

// Initialize database based on configuration
export async function initializeDatabase() {
  const config = getDatabaseConfig();
  dbType = config.type;

  console.log(`🔌 Initializing ${config.type.toUpperCase()} database...`);

  if (config.type === 'mysql') {
    // Lazy load MySQL module only when needed
    const { initializeMySQL, getMySQLDatabase } = await import("./mysql");
    const pool = await initializeMySQL(config);
    dbInstance = getMySQLDatabase(pool);
    return;
  }

  if (config.type === 'postgresql') {
    // Lazy load PostgreSQL module only when needed
    const { initializePostgreSQL, getPostgreSQLDatabase } = await import("./postgresql");
    const pool = await initializePostgreSQL(config);
    dbInstance = getPostgreSQLDatabase(pool);
    return;
  }

  // Default to SQLite
  dbInstance = await initializeSQLite(config);
}

// Export database instance with Proxy to handle async methods
export default new Proxy({} as any, {
  get(target, prop: string) {
    if (!dbInstance) {
      throw new Error("Database not initialized. Call initializeDatabase() first.");
    }

    const value = (dbInstance as any)[prop];
    
    // If it's a function, wrap it to handle both sync and async
    if (typeof value === 'function') {
      return function(...args: any[]) {
        const result = value.apply(dbInstance, args);
        
        // For SQLite, methods are synchronous
        if (dbType === 'sqlite') {
          return result;
        }
        
        // For MySQL/PostgreSQL, methods are already async
        return result;
      };
    }
    
    return value;
  },
});
