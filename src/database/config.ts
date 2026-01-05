// Database configuration
export interface DatabaseConfig {
  type: 'sqlite' | 'mysql' | 'postgresql';
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  path?: string; // For SQLite
}

export function getDatabaseConfig(): DatabaseConfig {
  const dbType = (process.env.DB_TYPE || 'sqlite').toLowerCase();

  if (dbType === 'mysql') {
    return {
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'variedades_fibia',
    };
  }

  if (dbType === 'postgresql' || dbType === 'postgres') {
    return {
      type: 'postgresql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'variedades_fibia',
    };
  }

  // Default to SQLite
  return {
    type: 'sqlite',
    path: process.env.DATABASE_PATH || './database.sqlite',
  };
}

