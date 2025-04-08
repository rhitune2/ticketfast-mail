import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db-schema";

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { ssl: "require" });

  const db = drizzle(client, { schema });

  
}
main();
