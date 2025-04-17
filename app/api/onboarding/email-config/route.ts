import { db } from "@/db";
import { smtpSettings, user } from "@/db-schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";

const schema = z.object({
  fromEmail: z.union([
    z.string().email("Invalid email address"),
    z.string().max(0)
  ]).optional(),
  fromName: z.string().optional()
    .refine(value => !value || value.length >= 2, {
      message: "From name must be at least 2 characters"
    }),
  isUsingSmtp: z.boolean().default(false),
  smtpHost: z.string().optional()
    .refine(value => !value || value.length >= 2, {
      message: "SMTP host must be at least 2 characters"
    }),
  smtpPort: z.string().optional()
    .refine(value => !value || /^\d+$/.test(value), {
      message: "SMTP port must be a number"
    }),
  smtpUsername: z.string().optional()
    .refine(value => !value || value.length >= 2, {
      message: "SMTP username must be at least 2 characters"
    }),
  smtpPassword: z.string().optional()
    .refine(value => !value || value.length >= 4, {
      message: "SMTP password must be at least 4 characters"
    }),
  smtpSecure: z.boolean().default(true),
})
.refine(data => {
  if (data.isUsingSmtp) {
    return !!data.smtpHost && !!data.smtpPort && !!data.smtpUsername && !!data.smtpPassword;
  }
  return true;
}, {
  message: "SMTP details are required if SMTP is enabled",
  path: ["smtpHost"]
})
.superRefine((data, ctx) => {
  // Only validate fromEmail if SMTP is enabled and a value is provided
  if (data.isUsingSmtp && data.fromEmail && data.fromEmail.length > 0) {
    try {
      z.string().email().parse(data.fromEmail);
    } catch (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid email format",
        path: ["fromEmail"]
      });
    }
  }
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({
        status: false,
        message: "Unauthorized",
      });
    }

    if (!session.user?.id) {
      return NextResponse.json({
        status: false,
        message: "User ID not found in session",
      });
    }

    const userId = session.user.id;

    try {
      const body = await request.json();
      const parsedData = await schema.parseAsync(body);

      // Start a transaction to ensure data consistency
      await db.transaction(async (tx) => {
        // Always update the user's isUsingSmtp flag

        // If SMTP is enabled, use upsert to insert or update SMTP settings
        if (parsedData.isUsingSmtp) {
          const smtpData = {
            host: parsedData.smtpHost || "",
            port: parsedData.smtpPort ? parseInt(parsedData.smtpPort) : 0,
            username: parsedData.smtpUsername || "",
            password: parsedData.smtpPassword || "",
            secure: parsedData.smtpSecure,
            fromEmail: parsedData.fromEmail || "",
            fromName: parsedData.fromName || "",
            isUsingSmtp:parsedData.isUsingSmtp,
            updatedAt: new Date()
          };
          
          await tx
            .insert(smtpSettings)
            .values({
              id: crypto.randomUUID(),
              ...smtpData,
              userId: userId,
              createdAt: new Date(),
            })
            .onConflictDoUpdate({
              target: smtpSettings.userId,
              set: smtpData
            });
        }
      });

      return NextResponse.json({
        status: true,
        message: parsedData.isUsingSmtp 
          ? "SMTP settings saved successfully" 
          : "Email preferences updated successfully",
      });
    } catch (validationError) {
      console.error("Validation error:", validationError);
      return NextResponse.json({
        status: false,
        message: validationError instanceof Error 
          ? validationError.message 
          : "Invalid data provided",
      });
    }
  } catch (error) {
    console.error("Error saving SMTP settings:", error);
    return NextResponse.json({
      status: false,
      message: error instanceof Error ? error.message : "Failed to save SMTP settings",
    });
  }
}
