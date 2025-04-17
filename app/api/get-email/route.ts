import { db, inbox } from "@/db";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json(
      {
        message: "Session not found.",
      },
      { status: 404 }
    );
  }

  const currentInbox = await db.query.inbox.findFirst({
    where: eq(inbox.organizationId, session?.session?.activeOrganizationId!),
  });

  if(!currentInbox){
    return NextResponse.json({
        message: "Inbox not found."
    } , { status: 404 })
  }

  return NextResponse.json({
    email: currentInbox.emailAddress,
  });

}
