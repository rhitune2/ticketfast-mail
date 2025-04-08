import { pgTable, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').notNull(),
	image: text('image'),

	// Onboarding fields 

	firstName: text('first_name'),
	lastName: text('last_name'),
	companyName: text('company_name'),
	companyIndustry: text('company_industry'),
	companySize: text('company_size'),
	communicationType: text('communication_type'),

	isUsingSmtp: boolean('is_using_smtp').notNull().default(false),


	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp('expires_at').notNull(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	activeOrganizationId: text('active_organization_id').references(() => organization.id, { onDelete: 'cascade' }),
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at'),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull()
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at'),
	updatedAt: timestamp('updated_at')
});

export const organization = pgTable("organization", {
	id: text("id").primaryKey(),
	name: text('name').notNull(),
	slug: text('slug').notNull().unique(),
	logo: text('logo'),
	metadata: text('metadata'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Member Schema (Better-Auth)
export const member = pgTable("member", {
	id: text("id").primaryKey(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	organizationId: text('organization_id').notNull().references(() => organization.id, { onDelete: 'cascade' }),
	role: text('role').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Invitation Schema (Better-Auth)
export const invitation = pgTable("invitation", {
	id: text("id").primaryKey(),
	email: text('email').notNull(),
	inviterId: text('inviter_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	organizationId: text('organization_id').notNull().references(() => organization.id, { onDelete: 'cascade' }),
	role: text('role').notNull(),
	status: text('status').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Team Schema
export const team = pgTable("team", {
	id: text("id").primaryKey(),
	name: text('name').notNull(),
	organizationId: text('organization_id').notNull().references(() => organization.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull()
});

export const smtpSettings = pgTable("smtp_settings", {
	id: text("id").primaryKey(),
	host: text('host').notNull(),
	port: integer('port').notNull(),
	username: text('username').notNull(),
	password: text('password').notNull(),
	secure: boolean('secure').default(true).notNull(),
	fromEmail: text('from_email').notNull(),
	fromName: text('from_name'),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }).unique(),
	organizationId: text('organization_id').references(() => organization.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull()
});