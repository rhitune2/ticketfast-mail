import { db } from "@/db";
import { smtpSettings } from "@/db-schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  fromEmail: z.string().email("Invalid email address").optional(),
  fromName: z.string().min(2, "From name must be at least 2 characters").optional(),
  isUsingSmtp: z.boolean().default(false),
  smtpHost: z.string().optional(),
  smtpPort: z.string().optional(),
  smtpUsername: z.string().optional(),
  smtpPassword: z.string().optional(),
  smtpSecure: z.boolean().default(true),
}).refine(data => {
  if (data.isUsingSmtp) {
    return !!data.smtpHost && !!data.smtpPort && !!data.smtpUsername && !!data.smtpPassword;
  }
  return true;
}, {
  message: "SMTP details are required if SMTP is enabled",
  path: ["smtpHost"]
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsedData = await schema.parseAsync(body);

    const session = await auth.api.getSession({ headers: await headers() });


    if (!session) {
      return NextResponse.json({
        status: false,
        message: "Unauthorized",
      });
    }

    // if smtp is enabled insert to smtp  settings 

    // if not enabled just update user.isUsingSmtp and return

    // await db
    //   .insert(smtpSettings)
    //   .values({
    //     id: crypto.randomUUID(),
    //     host: parsedData.smtpHost || "",
    //     port: parsedData.smtpPort ? parseInt(parsedData.smtpPort) : 0,
    //     username: parsedData.smtpUsername || "",
    //     password: parsedData.smtpPassword || "",
    //     secure: parsedData.smtpSecure,
    //     fromEmail: parsedData.fromEmail || "",
    //     fromName: parsedData.fromName || "",
    //     userId: session.user?.id!,
    //     createdAt: new Date(),
    //     updatedAt: new Date()
    //   })
    //   .onConflictDoUpdate({
    //     target: smtpSettings.userId,
    //     set: {
    //       host: parsedData.smtpHost || "",
    //       port: parsedData.smtpPort ? parseInt(parsedData.smtpPort) : 0,
    //       username: parsedData.smtpUsername || "",
    //       password: parsedData.smtpPassword || "",
    //       secure: parsedData.smtpSecure,
    //       fromEmail: parsedData.fromEmail || "",
    //       fromName: parsedData.fromName || "",
    //       updatedAt: new Date()
    //     }
    //   });
    
    return NextResponse.json({
      status: true,
      message: "SMTP settings saved successfully",
    });
  } catch (error) {
    console.error("Error saving SMTP settings:", error);
    return NextResponse.json({
      status: false,
      message: error instanceof Error ? error.message : "Failed to save SMTP settings",
    });
  }
}
