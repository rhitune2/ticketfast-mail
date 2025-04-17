"use server";

import { db, smtpSettings as smtpSettingsTable, SmtpSettings } from "@/db";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { z } from "zod";
import nodemailer from "nodemailer";
import { headers } from "next/headers";

// Zod schema for validation, matching the client-side one
const emailSettingsSchema = z.object({
  host: z.string().min(1, "Host is required"),
  port: z.coerce.number().int().positive("Port must be a positive integer"),
  username: z.string().min(1, "Username is required"),
  password: z.string(), // Keep password optional for update
  fromEmail: z.string().email("Invalid email address"),
  secure: z.boolean().default(true),
  fromName: z.string().optional(),
  isUsingSmtp: z.boolean().default(false), // Add isUsingSmtp
});

// Type for test function input
type TestEmailSettingsInput = Omit<z.infer<typeof emailSettingsSchema>, 'fromName' | 'isUsingSmtp'>; // Omit fields not needed for test

// Type for update function, including organizationId
const updateEmailSettingsSchema = emailSettingsSchema.extend({
  organizationId: z.string().min(1),
  // password can be the existing one if not changed, so make optional here for validation
  password: z.string().optional(), 
});
type UpdateEmailSettingsInput = z.infer<typeof updateEmailSettingsSchema>;

// Helper to check if the user is owner or admin
async function checkOwnerOrAdmin(organizationId: string): Promise<boolean> {
  const headerList = await headers(); // Await the Promise
  const requestHeaders = new Headers(headerList);

  const [session, organization] = await Promise.all([
    auth.api.getSession({ headers: requestHeaders }),
    auth.api.getFullOrganization({
      query: { organizationId },
      headers: requestHeaders,
    }),
  ]);

  if (!session?.user.id || !organization) return false;

  const member = organization.members.find((m) => m.userId === session.user.id);
  return member?.role === "owner" || member?.role === "admin";
}

/**
 * Fetches SMTP settings for the active organization.
 */
export async function getSmtpSettings(): Promise<SmtpSettings | null> {
  try {
    const headerList = await headers(); // Await the Promise
    const requestHeaders = new Headers(headerList);

    const organization = await auth.api.getFullOrganization({ headers: requestHeaders });
    if (!organization) {
      throw new Error("Organization not found.");
    }

    const settings = await db.query.smtpSettings.findFirst({
      where: eq(smtpSettingsTable.organizationId, organization.id),
    });

    return settings ?? null;
  } catch (error) {
    console.error("Error fetching SMTP settings:", error);
    return null;
  }
}

/**
 * Updates or creates SMTP settings for a given organization.
 * Only owners or admins can perform this action.
 */
export async function updateSmtpSettings(input: UpdateEmailSettingsInput): Promise<void> {
  const validatedInput = updateEmailSettingsSchema.safeParse(input);
  if (!validatedInput.success) {
    throw new Error(`Invalid input: ${validatedInput.error.message}`);
  }

  const { organizationId, ...settingsData } = validatedInput.data;

  const isAuthorized = await checkOwnerOrAdmin(organizationId);
  if (!isAuthorized) {
    throw new Error("Unauthorized: Only owner or admin can update settings.");
  }

  const headerList = await headers(); // Await the Promise
  const requestHeaders = new Headers(headerList);
  const session = await auth.api.getSession({ headers: requestHeaders });
  const userId = session?.user.id;

  if (!userId) {
    throw new Error("User session not found. Unable to save settings.");
  }

  try {
    const existingSettings = await db.query.smtpSettings.findFirst({
      where: eq(smtpSettingsTable.organizationId, organizationId),
    });

    // Determine the password to save
    let finalPassword = settingsData.password; 
    if (!finalPassword && existingSettings) {
      // If no new password provided during update, use the existing one
      finalPassword = existingSettings.password;
    } else if (!finalPassword && !existingSettings) {
      // If creating new settings and no password provided, throw error
      throw new Error("Password is required for new SMTP configurations.");
    }

    const dataToUpsert = {
      ...settingsData,
      password: finalPassword as string, // Ensure password is a string
      organizationId: organizationId,
      updatedAt: new Date(),
      userId: userId,
      // Ensure isUsingSmtp is included
      isUsingSmtp: settingsData.isUsingSmtp ?? false, 
    };

    if (existingSettings) {
      await db
        .update(smtpSettingsTable)
        .set({
          ...dataToUpsert,
          // password is already included in dataToUpsert
        })
        .where(eq(smtpSettingsTable.id, existingSettings.id));
    } else {
      // Insert new settings
      await db.insert(smtpSettingsTable).values({
        id: crypto.randomUUID(),
        ...dataToUpsert,
        // password is included in dataToUpsert
        createdAt: new Date(), // Set createdAt only on insert
      });
    }
  } catch (error) {
    console.error("Error updating SMTP settings:", error);
    if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint "smtp_settings_user_id_unique"')) {
      throw new Error("Failed to save settings. A configuration for this user might already exist.");
    }
    throw new Error("Failed to save SMTP settings.");
  }
}

/**
 * Tests the SMTP connection using provided settings.
 */
export async function testSmtpConnection(settings: TestEmailSettingsInput): Promise<{ success: boolean; message?: string }> {
  const validatedSettings = emailSettingsSchema
    .omit({ fromName: true, isUsingSmtp: true }) // Omit fields not needed for test
    .safeParse(settings);
  if (!validatedSettings.success) {
    return { success: false, message: `Invalid settings: ${validatedSettings.error.message}` };
  }

  const { host, port, username, password, secure, fromEmail } = validatedSettings.data;

  const testRecipient = fromEmail;

  const transporter = nodemailer.createTransport({
    host: host,
    port: port,
    secure: secure,
    auth: {
      user: username,
      pass: password,
    },
    tls: {
      rejectUnauthorized: secure
    }
  });

  try {
    await transporter.verify();

    return { success: true, message: "Connection verified successfully." };
  } catch (error) {
    console.error("SMTP Connection Test Failed:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: `Connection failed: ${errorMessage}` };
  } finally {
    transporter.close();
  }
}
