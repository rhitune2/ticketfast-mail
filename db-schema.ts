import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { SUBSCRIPTION_QUOTAS } from "./lib/constants";
import { relations } from 'drizzle-orm';

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),

  // Onboarding fields

  firstName: text("first_name"),
  lastName: text("last_name"),
  companyName: text("company_name"),
  companyIndustry: text("company_industry"),
  companySize: text("company_size"),
  communicationType: text("communication_type"),

  isUsingSmtp: boolean("is_using_smtp").notNull().default(false),
  isCompletedOnboarding: boolean("is_completed_onboarding").default(false),

  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const subscription = pgTable("subscriptions", {
  id: text("id").primaryKey(),

  // Free , Pro , Enterprise
  plan: text("plan").notNull().default("FREE"),

  // ACTIVE
  status: text("status").notNull().default("ACTIVE"),

  // default 100
  ticketQuota: integer("ticket_quota")
    .notNull()
    .default(SUBSCRIPTION_QUOTAS.FREE.ticketQuota),

  // default 10
  customerQuota: integer("customer_quota")
    .notNull()
    .default(SUBSCRIPTION_QUOTAS.FREE.customerQuota),

  // default 3
  organizationQuota: integer("organization_quota")
    .notNull()
    .default(SUBSCRIPTION_QUOTAS.FREE.organization.quota),

  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const inbox = pgTable("inbox", {
  id: text("id").primaryKey(),

  // default organization name and slug
  name: text("name").notNull(),
  slug: text("slug").notNull(),

  // slugify organization name + random string @ticketfa.st for default.
  emailAddress: text("email_adress").notNull().unique(),

  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  activeOrganizationId: text("active_organization_id").references(
    () => organization.id,
    { onDelete: "cascade" }
  ),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Member Schema (Better-Auth)
export const member = pgTable("member", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  teamId: text("team_id"),
  createdAt: timestamp("created_at").notNull(),
});

// Invitation Schema (Better-Auth)
export const invitation = pgTable("invitation", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  inviterId: text("inviter_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  status: text("status").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Team Schema
export const team = pgTable("team", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at"),
});

export const smtpSettings = pgTable("smtp_settings", {
  id: text("id").primaryKey(),
  host: text("host").notNull(),
  port: integer("port").notNull(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  secure: boolean("secure").default(true).notNull(),
  fromEmail: text("from_email").notNull(),
  fromName: text("from_name"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" })
    .unique(),
  organizationId: text("organization_id").references(() => organization.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const ticket = pgTable("ticket", {
  id: text("id").primaryKey(),

  subject: text("subject").notNull(),

  // ASSIGNED , UNASSIGNED , WAITING,  CLOSED
  status: text("status").default("UNASSIGNED").notNull(),

  // LOW NORMAL MEDIUM HIGH
  priority: text("priority").default("NORMAL").notNull(),

  fromEmail: text("from_email"),
  fromName: text("from_name"),
  toEmail: text("to_email"),
  ccEmails: text("cc_emails"),
  bccEmails: text("bcc_emails"),

  inboxId: text("inbox_id")
    .notNull()
    .references(() => inbox.id),

  // team member assigne id
  assigneeId: text("assignee_id").references(() => user.id),

  // creator of organization
  creatorId: text("creator_id").references(() => user.id),
  contactId: text("contact_id").references(() => contact.id),

  isOverQuota: boolean("is_over_quota").notNull().default(false),

  organizationId: text("organization_id").references(() => organization.id, {
    onDelete: "cascade",
  }),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const contact = pgTable("contacts", {
  id: text("id").primaryKey(),

  firstName: text("first_name"),
  lastName: text("last_name"),
  fullName: text("full_name"),

  email: text("email").notNull().unique(),
  phoneNumber: text("phone_number"),
  company: text("company"),
  notes: text("notes"),

  createdById: text("created_by_id").references(() => user.id),
  organizationId: text("organization_id").references(() => organization.id, {
    onDelete: "cascade",
  }),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const ticketMessage = pgTable("ticket_message", {
  id: text("id").primaryKey(),
  content: text("content").notNull(), // HTML or text content of the email
  contentType: text("content_type").notNull().default("text/html"), // Content type (html or plain text)
  
  // Metadata
  fromName: text("from_name"),
  fromEmail: text("from_email"),
  isInternal: boolean("is_internal").notNull().default(false),
  isAgent: boolean("is_agent").notNull().default(false),
  
  // Foreign key to ticket
  ticketId: text("ticket_id")
    .notNull()
    .references(() => ticket.id, { onDelete: "cascade" }),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Attachments table for storing email attachments
export const ticketAttachment = pgTable("ticket_attachment", {
  id: text("id").primaryKey(),
  
  // Attachment data
  filename: text("filename").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  checksum: text("checksum"),
  
  // Blob data - Store the actual attachment content directly in the database
  blobData: text("blob_data"),  // Base64 encoded attachment data
  
  // Foreign keys
  ticketId: text("ticket_id")
    .notNull()
    .references(() => ticket.id, { onDelete: "cascade" }),
  messageId: text("message_id")
    .references(() => ticketMessage.id, { onDelete: "cascade" }),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const ticketRelations = relations(ticket, ({ one, many }) => ({
  // ticket.contactId alanını kullanarak contact tablosuyla TEKİL ilişki
  contact: one(contact, {
    fields: [ticket.contactId],
    references: [contact.id],
  }),
  // Örnek İlişkiler (İhtiyaca göre uncomment/düzenle)
  assignee: one(user, {
    fields: [ticket.assigneeId],
    references: [user.id],
    relationName: 'TicketAssignee',
  }),
  creator: one(user, {
    fields: [ticket.creatorId],
    references: [user.id],
    relationName: 'TicketCreator',
  }),
  inbox: one(inbox, {
      fields: [ticket.inboxId],
      references: [inbox.id]
  }),
  messages: many(ticketMessage),
  attachments: many(ticketAttachment),
}));

export const contactRelations = relations(contact, ({ many }) => ({
  // contact'a bağlı ticket'ları getirmek için ÇOĞUL ilişki (ters ilişki)
  tickets: many(ticket),
}));

export const ticketMessageRelations = relations(ticketMessage, ({ one, many }) => ({
  ticket: one(ticket, {
    fields: [ticketMessage.ticketId],
    references: [ticket.id],
  }),
  attachments: many(ticketAttachment),
}));

export const ticketAttachmentRelations = relations(ticketAttachment, ({ one }) => ({
  ticket: one(ticket, {
    fields: [ticketAttachment.ticketId],
    references: [ticket.id],
  }),
  message: one(ticketMessage, {
    fields: [ticketAttachment.messageId],
    references: [ticketMessage.id],
  }),
}));
