import { Request, Response } from "express";
import db from "../database/db";
import * as fs from "fs";
import * as path from "path";

export async function checkDatabaseStatus(req: Request, res: Response) {
  try {
    const dbType = process.env.DB_TYPE || 'sqlite';
    const dbPath = process.env.DATABASE_PATH || path.join(__dirname, "../../database.sqlite");
    const dbExists = dbType === 'sqlite' ? fs.existsSync(dbPath) : null;
    
    // Try to query the database
    let dbWorking = false;
    let userCount = 0;
    let productCount = 0;
    let errorMessage = null;

    try {
      const userStmt = db.prepare("SELECT COUNT(*) as count FROM users");
      const productStmt = db.prepare("SELECT COUNT(*) as count FROM products");
      
      const users = await userStmt.get() as { count: number };
      const products = await productStmt.get() as { count: number };
      
      userCount = Number(users.count);
      productCount = Number(products.count);
      dbWorking = true;
    } catch (error: any) {
      dbWorking = false;
      errorMessage = error.message;
    }

    res.json({
      connected: dbWorking,
      databaseType: dbType,
      databaseFile: dbType === 'sqlite' ? dbPath : null,
      databaseName: dbType !== 'sqlite' ? process.env.DB_NAME : null,
      fileExists: dbExists,
      fileSize: dbExists ? fs.statSync(dbPath).size : null,
      stats: {
        users: userCount,
        products: productCount,
      },
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      connected: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

