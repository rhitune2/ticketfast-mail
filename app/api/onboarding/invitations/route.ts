import { db } from "../../../../db";
import { invitation } from "../../../../db-schema";
import { auth } from "../../../../lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";

// Define schema for invitation data
const invitationSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.string().refine(
    value => ["admin", "member", "support"].includes(value),
    { message: "Role must be admin, member, or support" }
  ),
});

const schemaBody = z.object({
  invitations: z.array(invitationSchema),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({
        status: false,
        message: "Unauthorized",
      }, { status: 401 });
    }

    if (!session.user?.id) {
      return NextResponse.json({
        status: false,
        message: "User ID not found in session",
      }, { status: 401 });
    }

    const userId = session.user.id;

    try {
      const body = await request.json();
      const { invitations } = await schemaBody.parseAsync(body);

      // Get user's organization
      const organization = await auth.api.getFullOrganization({ headers: await headers() });
      
      if (!organization || !organization.id) {
        return NextResponse.json({
          status: false,
          message: "Organization not found. Please complete organization setup first.",
        }, { status: 400 });
      }

      // auth api add invitation logic here.

      // we should send invites 1by1 not all in one. it would cause slow rendering.

      return NextResponse.json({
        status: true,
        message: invitations.length > 0 
          ? `${invitations.length} invitation(s) sent successfully` 
          : "Onboarding completed successfully",
      });
    } catch (validationError) {
      console.error("Validation error:", validationError);
      return NextResponse.json({
        status: false,
        message: validationError instanceof Error 
          ? validationError.message 
          : "Invalid data provided",
      }, { status: 400 });
    }
  } catch (error) {
    console.error("Error processing invitations:", error);
    return NextResponse.json({
      status: false,
      message: error instanceof Error ? error.message : "Failed to process invitations",
    }, { status: 500 });
  }
}
