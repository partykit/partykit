import type { PartyKitServer } from "partykit/server";
import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DB_CONNECTION_URL as string;

export default {
  async onFetch() {
    const client = postgres(connectionString, { prepare: false });
    const db = drizzle(client);

    const users = pgTable("users", {
      id: serial("id").primaryKey(),
      fullName: text("full_name"),
      phone: varchar("phone", { length: 256 })
    });

    const allUsers = await db.select().from(users);
    return new Response(JSON.stringify(allUsers), {
      headers: { "content-type": "application/json" }
    });
  }
} satisfies PartyKitServer;
