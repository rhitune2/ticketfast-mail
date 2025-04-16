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
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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

export async function getTicketMessages(id: string) {
  try {
    // const session = await auth.api.getSession({ headers: await headers() });

    // if (!session?.session?.activeOrganizationId) {
    //   console.error("Unauthorized: No active session or organization ID");
    //   return [];
    // }

    const messages = await db
      .select()
      .from(ticketMessage)
      .where(eq(ticketMessage.ticketId, id))
      .orderBy(ticketMessage.createdAt);


    // For each message, fetch its attachments
    const messagesWithAttachments = await Promise.all(
      messages.map(async (message) => {
        const attachments = await db
          .select()
          .from(ticketAttachment)
          .where(eq(ticketAttachment.messageId, message.id));

        return {
          ...message,
          attachments: attachments.length > 0 ? attachments : undefined,
        };
      })
    );

    return messagesWithAttachments;
  } catch (error) {
    console.error("Failed to fetch ticket messages:", error);
    return [];
  }
}

export async function getTicketAttachments(ticketId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.session?.activeOrganizationId) {
      console.error("Unauthorized: No active session or organization ID");
      return [];
    }

    const ticketCheck = await db.query.ticket.findFirst({
      columns: { id: true },
      where: and(
        eq(ticket.id, ticketId),
        eq(ticket.organizationId, session.session.activeOrganizationId)
      ),
    });

    if (!ticketCheck) {
      console.warn(
        `Unauthorized or ticket not found for attachments query: ${ticketId}`
      );
      return [];
    }

    const attachments = await db.query.ticketAttachment.findMany({
      where: eq(ticketAttachment.ticketId, ticketId),
    });

    return attachments;
  } catch (error) {
    console.error("Failed to fetch ticket attachments:", error);
    return [];
  }
}

// Fetches a user only if they belong to the current active organization
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


      const organizationMembers = await auth.api.getFullOrganization({
        headers: await headers()
      })

      console.log(organizationMembers?.members)

      console.log({ assigneeData })

    if (!assigneeData || assigneeData.length === 0) {

    }

    return assigneeData[0];
  } catch (error) {
    console.error("Failed to fetch assignee:", error);
    return null;
  }
}
export async function getAllAssignees(){
  const getAllAssignees = await auth.api.getFullOrganization({
    headers: await headers()
  })

  return getAllAssignees?.members;
}