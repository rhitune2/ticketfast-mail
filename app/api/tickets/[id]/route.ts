import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm"; // Import and

import { db } from "@/db";
import { ticket } from "@/db-schema";
import { auth } from "@/lib/auth"; // Assuming requiresAuth is the auth middleware
import { headers } from "next/headers";

// Define allowed statuses based on db-schema comments
const ALLOWED_TICKET_STATUSES = [
  "ASSIGNED",
  "UNASSIGNED",
  "WAITING",
  "CLOSED",
] as const;
type TicketStatus = (typeof ALLOWED_TICKET_STATUSES)[number];

// Define allowed priorities based on db-schema comments
const ALLOWED_TICKET_PRIORITIES = [
  "LOW",
  "NORMAL",
  "MEDIUM",
  "HIGH",
] as const;
type TicketPriority = (typeof ALLOWED_TICKET_PRIORITIES)[number];

// Zod schema for validation
const updateTicketSchema = z.object({
  status: z.enum(ALLOWED_TICKET_STATUSES).optional(),
  assigneeId: z.string().nullable().optional(), // Allow null for unassigning
  priority: z.enum(ALLOWED_TICKET_PRIORITIES).optional(),
}).refine(data => Object.keys(data).length > 0, { // Ensure at least one field is provided
  message: "At least one field (status, assigneeId, priority) must be provided for update",
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ticketId = (await params).id;

  if (!ticketId) {
    return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 });
  }

  let body;
  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const validation = updateTicketSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: "Validation failed", details: validation.error.errors }, { status: 400 });
  }

  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.session?.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isHaveAccess = await db.query.ticket.findFirst({
    where: and(
      eq(ticket.id, ticketId),
      eq(ticket.organizationId, session.session.activeOrganizationId)
    )
  });

  if (!isHaveAccess) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { status, assigneeId, priority } = validation.data;

  // Construct the update payload
  const updatePayload: Partial<typeof ticket.$inferInsert> = {
    updatedAt: new Date(), // Always update the timestamp
  };
  if (status !== undefined) {
    updatePayload.status = status;
  }
  if (assigneeId !== undefined) { // Handle null explicitly for unassigning
    updatePayload.assigneeId = assigneeId;
  }
  if (priority !== undefined) {
    updatePayload.priority = priority;
  }

  // Check if there's anything to update besides the timestamp
  if (Object.keys(updatePayload).length <= 1) {
      return NextResponse.json({ error: "No valid fields provided for update" }, { status: 400 });
  }


  try {
    // Perform the update
    const updatedTicket = await db
      .update(ticket)
      .set(updatePayload)
      .where(and(eq(ticket.id, ticketId), eq(ticket.organizationId, session.session.activeOrganizationId))) 
      .returning(); // Return the updated record

    if (updatedTicket.length === 0) {
      return NextResponse.json({ error: "Ticket not found or not authorized" }, { status: 404 });
    }

    return NextResponse.json(updatedTicket[0]);
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}
