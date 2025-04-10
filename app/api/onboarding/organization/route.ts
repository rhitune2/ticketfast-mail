// app/api/user/organization/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { organization } from "@/db-schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import slugify from "slugify"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json(
        {
          status: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // Find organization for this user
    const org = await db.query.organization.findFirst({
      where: eq(organization.id, session.user.id),
    });

    return NextResponse.json({
      status: true,
      organization: org || null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch organization",
      },
      { status: 500 }
    );
  }
}

const schema = z.object({
  organizationName: z.string().min(2),
  organizationLogo: z.string(),
});

export async function POST(request: Request) {
  try {

    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsedBody = await schema.parseAsync(body);

    // Check if organization exists for this user
    const existingOrg = await auth.api.getFullOrganization({ headers: await headers() });

    if (existingOrg) {
      // Update existing organization
      await auth.api.updateOrganization({
        body : {
          data: {
            name: parsedBody.organizationName,
            logo: parsedBody.organizationLogo,
          },
          organizationId: existingOrg.id,
        },
        headers: await headers(),
      })
      
    } else {

      const checkSlug = await auth.api.checkOrganizationSlug({
        body: {
          slug: slugify(parsedBody.organizationName),
        },
        headers: await headers(),
      });

      if (!checkSlug) {
        return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
      }

      await auth.api.createOrganization({
        body:{
          name: parsedBody.organizationName,
          slug: slugify(parsedBody.organizationName),
          logo: parsedBody.organizationLogo,
        },
        headers: await headers(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving organization:", error);
    return NextResponse.json(
      { error: "Failed to save organization" },
      { status: 500 }
    );
  }
}
