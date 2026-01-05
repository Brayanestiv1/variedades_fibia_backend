import { initializeDatabase } from "./db";

async function migrate() {
  console.log("Initializing database...");
  await initializeDatabase();
  console.log("Database initialized successfully!");
  process.exit(0);
}

migrate().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});

