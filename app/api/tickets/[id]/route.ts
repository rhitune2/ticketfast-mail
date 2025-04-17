import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm"; // Import and

import { db } from "@/db";
import { ticket, user } from "@/db-schema";
import { auth } from "@/lib/auth"; // Assuming requiresAuth is the auth middleware
import { headers } from "next/headers";
import { sendTicketAssignment } from "@/utils/email";
import { TAGS } from "@/lib/constants";

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
  tag: z.enum(TAGS as [string, ...string[]]).nullable().optional(), // Add tag support with validation
}).refine(data => Object.keys(data).length > 0, { // Ensure at least one field is provided
  message: "At least one field (status, assigneeId, priority, tag) must be provided for update",
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
  
  // For debugging purposes
  console.log("Received update request:", body);

  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.session?.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existingTicket = await db.query.ticket.findFirst({
    where: and(
      eq(ticket.id, ticketId),
      eq(ticket.organizationId, session.session.activeOrganizationId)
    )
  });

  if (!existingTicket) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { status, assigneeId, priority, tag } = validation.data;

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
  if (tag !== undefined) { // Handle tag updates
    updatePayload.tag = tag;
  }

  // Check if there's anything to update besides the timestamp
  if (Object.keys(updatePayload).length <= 1) {
      return NextResponse.json({ error: "No valid fields provided for update" }, { status: 400 });
  }


  try {
    // Get current user's name for email notification
    const currentUser = await db.query.user.findFirst({
      where: eq(user.id, session.session.userId)
    });
    
    // Perform the update
    const updatedTicket = await db
      .update(ticket)
      .set(updatePayload)
      .where(and(eq(ticket.id, ticketId), eq(ticket.organizationId, session.session.activeOrganizationId))) 
      .returning(); // Return the updated record

    if (updatedTicket.length === 0) {
      return NextResponse.json({ error: "Ticket not found or not authorized" }, { status: 404 });
    }
    
    // Send notification if a user was assigned
    if (assigneeId !== undefined && assigneeId !== null && assigneeId !== existingTicket.assigneeId) {
      try {
        // Get assignee information
        const assignee = await db.query.user.findFirst({
          where: eq(user.id, assigneeId)
        });
        
        if (assignee && assignee.email) {
          await sendTicketAssignment({
            assigneeEmail: assignee.email,
            ticketSubject: existingTicket.subject,
            ticketId: ticketId,
            assignerName: currentUser?.name,
            priority: updatedTicket[0].priority,
            status: updatedTicket[0].status
          });
          console.log(`Ticket assignment notification sent successfully to ${assignee.email}`);
        }
      } catch (emailError) {
        console.error(`Failed to send assignment notification for ticket ${ticketId}:`, emailError);
        // Continue execution even if email fails
      }
    }

    return NextResponse.json(updatedTicket[0]);
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}
