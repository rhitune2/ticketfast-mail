import { db, user } from "@/db";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  companyIndustry: z.string().min(1, "Please select an industry"),
  companySize: z.string().min(1, "Please select a company size"),
  communicationType: z.string().min(1, "Please select a communication type"),
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

    const update = await db
      .update(user)
      .set(parsedData)
      .where(eq(user.id, session.user.id))

    if(!update){
      return NextResponse.json({
        status: false,
        message: "Failed to save user information",
      });
    }

    return NextResponse.json({
      status: true,
      message: "User information saved successfully",
    });
  } catch (error) {
    return NextResponse.json({
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to save user information",
    });
  }
}
