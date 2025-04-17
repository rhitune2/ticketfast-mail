import { db, ticketMessage, ticket, smtpSettings } from "@/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { sendTicket } from "@/utils/email";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ticketId = (await params).id;
  if (!ticketId) {
    return NextResponse.json(
      { message: "Ticket ID is required" },
      { status: 400 }
    );
  }

  let content: string;
  try {
    const body = await request.json();
    content = body.content;
    if (!content || content.trim() === "" || content.trim() === "<p></p>") {
      return NextResponse.json(
        { message: "Reply content cannot be empty" },
        { status: 400 }
      );
    }
  } catch (e) {
    return NextResponse.json(
      { message: "Invalid request body" },
      { status: 400 }
    );
  }

  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.session?.userId || !session?.session?.activeOrganizationId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.session.userId;
    const organizationId = session.session.activeOrganizationId;
    const userEmail = session.user.email;
    const userName = session.user.name; // Assuming name exists on user session

    // 1. Verify the ticket exists and belongs to the user's organization and get necessary ticket data
    const existingTicket = await db.query.ticket.findFirst({
      where: and(
        eq(ticket.id, ticketId),
        eq(ticket.organizationId, organizationId)
      ),
      with: {
        inbox: true,  // Include the inbox relation for email sending
      }
    });

    if (!existingTicket) {
      return NextResponse.json(
        { message: "Ticket not found or not authorized" },
        { status: 404 }
      );
    }

    const emailSettings = await db.query.smtpSettings.findFirst({
      where: eq(smtpSettings.organizationId, organizationId),
    });

    if (!existingTicket.fromEmail) {
      return NextResponse.json(
        { message: "Ticket doesn't have a sender email address" },
        { status: 400 }
      );
    }
    
    const emailSubject = `Re: ${existingTicket.subject}`;
    const uniqueMessageId = uuidv4(); // For email threading
    
    // Send email reply to the ticket sender
    try {
      if (!emailSettings) {
        // Using the inbox's email when no custom SMTP settings are available
        await sendTicket({
          type: "ticketfast",
          to: existingTicket.fromEmail, // Send to the original email that created the ticket
          subject: emailSubject,
          url: "", // This parameter is required but seems unused - consider updating the function signature
          content,
          smtpSettings: undefined,
        });
      } else {
        // Using custom SMTP settings when available
        await sendTicket({
          type: emailSettings.isUsingSmtp ? "smtp" : "ticketfast",
          to: existingTicket.fromEmail, // Send to the original email that created the ticket
          subject: emailSubject,
          url: "", // This parameter is required but seems unused
          content,
          smtpSettings: emailSettings.isUsingSmtp ? emailSettings : undefined,
        });
      }
      console.log(`Email sent successfully for ticket ${ticketId}`);
    } catch (emailError) {
      console.error(`Failed to send email for ticket ${ticketId}:`, emailError);
      // Continue execution to at least save the message in the database
    }

    // 2. Insert the new message
    const messageId = uuidv4(); // Generate a unique ID for the message
    await db.insert(ticketMessage).values({
      id: messageId,
      ticketId: ticketId,
      fromEmail: userEmail ?? undefined, // Use agent's email from session
      fromName: userName ?? undefined, // Use agent's name from session
      content: content, // The HTML content from the editor
      createdAt: new Date(),
      contentType: "text/html",
      isAgent: true, // SET to true for agent replies
      isInternal: false, // Standard replies are not internal notes
    });

    return NextResponse.json(
      { success: true, messageId: messageId },
      { status: 201 }
    );
  } catch (error) {
    console.error(`Failed to add reply to ticket ${ticketId}:`, error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
