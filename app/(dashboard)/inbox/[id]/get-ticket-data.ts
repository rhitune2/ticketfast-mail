import { db, Ticket } from "@/db";
import {
  ticket,
  ticketMessage,
  ticketAttachment,
  user,
  contact,
  inbox,
  member,
} from "@/db-schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Types for better type checking
export type TicketWithContact = Ticket & { contact: any | null };
export type TicketMessageWithAttachments = typeof ticketMessage.$inferSelect & { attachments?: typeof ticketAttachment.$inferSelect[] };

export async function getTicketById(ticketId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.session?.activeOrganizationId) {
      return null;
    }

    const ticketData = await db.query.ticket.findFirst({
      where: and(
        eq(ticket.id, ticketId),
        eq(ticket.organizationId, session.session.activeOrganizationId)
      ),
      with: { 
        contact: true 
      }
    });

    return ticketData ?? null;
  } catch (error) {
    console.error("Failed to fetch ticket:", error);
    return null;
  }
}

export async function getTicketMessages(id: string): Promise<TicketMessageWithAttachments[]> {
  try {
    // Fetch all messages for the ticket in a single query
    const messages = await db
      .select()
      .from(ticketMessage)
      .where(eq(ticketMessage.ticketId, id))
      .orderBy(ticketMessage.createdAt);

    if (messages.length === 0) {
      return [];
    }
    
    // Fetch all attachments for all messages in a single query
    const allAttachments = await db
      .select()
      .from(ticketAttachment)
      .where(eq(ticketAttachment.ticketId, id));
      
    // Create a map of messageId -> attachments[] for quick lookup
    const attachmentsByMessageId = new Map();
    
    allAttachments.forEach(attachment => {
      if (!attachmentsByMessageId.has(attachment.messageId)) {
        attachmentsByMessageId.set(attachment.messageId, []);
      }
      attachmentsByMessageId.get(attachment.messageId).push(attachment);
    });
    
    // Efficiently attach the attachments to each message
    const messagesWithAttachments = messages.map(message => {
      const attachments = attachmentsByMessageId.get(message.id) || [];
      return {
        ...message,
        attachments: attachments.length > 0 ? attachments : undefined,
      };
    });

    return messagesWithAttachments;
  } catch (error) {
    console.error("Failed to fetch ticket messages:", error);
    return [];
  }
}

export async function getTicketAttachments(ticketId: string) {
  try {
    // Directly fetch attachments without the extra authorization check
    // since this would be called from pages that already check auth
    const attachments = await db
      .select()
      .from(ticketAttachment)
      .where(eq(ticketAttachment.ticketId, ticketId));

    return attachments;
  } catch (error) {
    console.error("Failed to fetch ticket attachments:", error);
    return [];
  }
}

// Fetches a user by ID (simplified for performance)
export async function getTicketAssignee(assigneeId: string | null) {
  if (!assigneeId) return null;

  try {
    const assigneeData = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      })
      .from(user)
      .where(eq(user.id, assigneeId))
      .limit(1);

    if (!assigneeData || assigneeData.length === 0) {
      return null;
    }

    return assigneeData[0];
  } catch (error) {
    console.error("Failed to fetch assignee:", error);
    return null;
  }
}

// Get all organization members for assignee selection
export async function getAllAssignees() {
  try {
    const organization = await auth.api.getFullOrganization({
      headers: await headers()
    });
    
    return organization?.members || [];
  } catch (error) {
    console.error("Failed to fetch all assignees:", error);
    return [];
  }
}