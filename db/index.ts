import { drizzle } from "drizzle-orm/postgres-js";
import { type InferSelectModel } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "@/db-schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const client = postgres(connectionString, { ssl: "require" });

export const db = drizzle(client, { schema });

export type DbClient = typeof db;
export * from "@/db-schema";

export type User = InferSelectModel<typeof schema.user>;
export type Organization = InferSelectModel<typeof schema.organization>;
export type Subscription = InferSelectModel<typeof schema.subscription>;
export type Inbox = InferSelectModel<typeof schema.inbox>;
export type Ticket = InferSelectModel<typeof schema.ticket>;
export type Contact = InferSelectModel<typeof schema.contact>;
export type TicketMessage = InferSelectModel<typeof schema.ticketMessage>;
export type TicketAttachment = InferSelectModel<typeof schema.ticketAttachment>;
export type Member = InferSelectModel<typeof schema.member>;
export type Session = InferSelectModel<typeof schema.session>;