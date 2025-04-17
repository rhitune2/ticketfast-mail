import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  db,
  contact as contactSchema, // Alias contact schema
  ticket as ticketSchema, // Alias ticket schema
  inbox as inboxSchema,
  ticketMessage as ticketMessageSchema,
  ticketAttachment as ticketAttachmentSchema,
  subscription as subscriptionSchema,
  subscription,
  contact,
} from "@/db";
import { categorizeEmail } from "@/lib/ai/categorize-email";
import {
  eq,
  and,
  isNull,
  sql,
  count,
  gte,
  InferSelectModel, // Import InferSelectModel
  InferInsertModel,
  lt, // Import InferInsertModel
} from "drizzle-orm";
import { addMonths, startOfMonth } from "date-fns";

// Define interface for email data based on forward-email webhook structure
interface ForwardEmailAttachment {
  type: string;
  content: {
    type: string;
    data: number[];
  };
  contentType: string;
  partId: string;
  release: null;
  contentDisposition: string;
  filename: string;
  headers: Record<string, string>;
  checksum: string;
  size: number;
}

interface ForwardEmailWebhook {
  attachments?: ForwardEmailAttachment[];
  from?: {
    value: Array<{
      address: string;
      name: string;
    }>;
    text: string;
    html?: string;
  };
  html?: string;
  text?: string;
  textAsHtml?: string;
  date?: string;
  messageId?: string;
  subject?: string;
  recipients?: string[];
  headerLines?: Array<{
    key: string;
    line: string;
  }>;
  headers?: string;
  session?: {
    recipient: string;
    sender: string;
    mta: string;
    arrivalDate: string;
    remoteAddress: string;
  };
}

// --- Define types based on schema ---
type Contact = InferSelectModel<typeof contactSchema>;
type NewContact = InferInsertModel<typeof contactSchema>;
type Ticket = InferSelectModel<typeof ticketSchema>;
type NewTicket = InferInsertModel<typeof ticketSchema>;
// ---

/**
 * Handles inbound mail processing from forward-email webhook
 * Parses the email data and stores it in the database
 */
async function handleInboundMail(data: ForwardEmailWebhook) {
  try {
    console.log("Processing inbound email from forward-email");

    // Extract email information
    let fromEmail = "";
    let fromName = "";

    // Parse the 'from' field
    if (data.from?.value && data.from.value.length > 0) {
      fromEmail = data.from.value[0].address;
      fromName = data.from.value[0].name || fromEmail.split("@")[0];
    } else if (data.from?.text) {
      // Fallback to text representation
      const fromMatch = data.from.text.match(/^(?:(.*?)\s*<(.+?)>|(.+))$/);
      if (fromMatch) {
        if (fromMatch[2]) {
          // Format was "Name <email>"
          fromName = fromMatch[1]?.trim() || "";
          fromEmail = fromMatch[2].trim();
        } else {
          // Format was just email
          fromEmail = fromMatch[3].trim();
          fromName = fromEmail.split("@")[0] || "";
        }
      }
    }

    // Get recipient email
    const toEmail = data.recipients?.[0] || data.session?.recipient || "";
    if (!toEmail) {
      console.error("No recipient found in the email data");
      return NextResponse.json(
        { error: "No recipient found" },
        { status: 400 }
      );
    }

    const subject = data.subject || "(No Subject)";

    // Get HTML and text content
    const htmlContent = data.html || data.textAsHtml || "";
    const textContent = data.text || "";

    // Find the inbox by email address
    const inboxes = await db
      .select()
      .from(inboxSchema)
      .where(eq(inboxSchema.emailAddress, toEmail));

    if (!inboxes || inboxes.length === 0) {
      console.error(`No inbox found for email address: ${toEmail}`);
      return NextResponse.json({ error: "Inbox not found" }, { status: 404 });
    }

    const targetInbox = inboxes[0];

    // Look up or create contact
    let contactRecord: Contact | null = null;

    const currentSubscription = await db
      .select()
      .from(subscriptionSchema)
      .where(eq(subscriptionSchema.userId, targetInbox.userId));

    if (!currentSubscription || currentSubscription.length === 0) {
      console.error(`No subscription found for user: ${targetInbox.userId}`);
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    const subscriptionT = currentSubscription[0];

    if (fromEmail) {
      // Check if contact exists
      let existingContacts;

      // Handle organization filtering based on whether organizationId exists
      if (targetInbox.organizationId) {
        existingContacts = await db
          .select()
          .from(contact)
          .where(
            and(
              eq(contact.email, fromEmail),
              eq(contact.organizationId, targetInbox.organizationId)
            )
          );
      } else {
        existingContacts = await db
          .select()
          .from(contact)
          .where(
            and(
              eq(contact.email, fromEmail),
              isNull(contact.organizationId)
            )
          );
      }

      if (existingContacts && existingContacts.length > 0) {
        contactRecord = existingContacts[0];
      }

      // If no contact found, create a new one
      if (!contactRecord) {
        // 1. Get the count of contacts created within the current subscription period
        const contactCountResult = await db
          .select({ value: count() }) // Use count aggregation
          .from(contact)
          .where(
            and(
              // Filter by organization or user (based on inbox)
              eq(contact.organizationId, targetInbox.organizationId),
              // Filter by current subscription period
              gte(contact.createdAt, subscriptionT.createdAt), // Only count contacts created ON or AFTER subscription start
              lt(contact.createdAt, addMonths(subscriptionT.createdAt, 1))             // Only count contacts created BEFORE the next billing cycle
            )
          );

        const currentPeriodContactCount = contactCountResult[0]?.value ?? 0; // Default to 0 if no result

        console.log(`Contacts created this period: ${currentPeriodContactCount}, Quota: ${subscriptionT.customerQuota}`);

        // 2. Check against the customer quota for the current period
        if (currentPeriodContactCount >= subscriptionT.customerQuota) {
          console.warn(
            `Customer quota exceeded for user: ${targetInbox.userId} (or org: ${targetInbox.organizationId}). Cannot create new contact.`
          );

          // Send mail
          
          return NextResponse.json(
            { error: "Customer quota for the current period exceeded" },
            { status: 429 } // 429 Too Many Requests is appropriate for rate limiting/quota
          );
        }

        // 3. Create the new contact if quota is not exceeded
        const contactData: NewContact = {
          // Use defined NewContact type
          id: uuidv4(),
          email: fromEmail,
          fullName: fromName,
          firstName: fromName.split(" ")[0] || "",
          lastName: fromName.split(" ").slice(1).join(" ") || "",
          organizationId: targetInbox.organizationId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const [newContact] = await db
          .insert(contactSchema) // Use schema alias
          .values(contactData)
          .returning();

        const [decrement] = await db
          .update(subscription)
          .set({ customerQuota: sql`${subscription.customerQuota} - 1` })
          .where(eq(subscription.id, subscriptionT.id));

        contactRecord = newContact;
      }
    }

    // Analyze the email content to categorize the ticket using AI
    console.log("Analyzing email content for ticket categorization...");
    let ticketStatus = "UNASSIGNED";
    let ticketPriority = "NORMAL";
    let ticketTag = null;

    try {
      const categorization = await categorizeEmail({
        emailContent: textContent || "",
        subject: subject,
        fromName: fromName,
        fromEmail: fromEmail
      });

      // Use the AI-determined values
      ticketStatus = categorization.status;
      ticketPriority = categorization.priority;
      ticketTag = categorization.tag;

      console.log(`AI Categorization result - Status: ${ticketStatus}, Priority: ${ticketPriority}, Tag: ${ticketTag || 'None'}, Confidence: ${categorization.analysis.confidence}`);
      console.log(`Reasoning: ${categorization.analysis.reasoning}`);
    } catch (error) {
      console.error("Error during ticket categorization:", error);
      // Continue with default values if categorization fails
    }

    // Create a new ticket with AI-determined values
    const ticketData: NewTicket = {
      // Use defined NewTicket type
      id: uuidv4(),
      subject: subject,
      status: ticketStatus,
      priority: ticketPriority,
      tag: ticketTag,
      fromEmail: fromEmail,
      fromName: fromName,
      toEmail: toEmail,
      inboxId: targetInbox.id,
      creatorId: targetInbox.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      contactId: contactRecord ? contactRecord.id : null,
    };

    // Add organization reference if available
    if (targetInbox.organizationId) {
      ticketData.organizationId = targetInbox.organizationId;
    }

    // For example : 2025-04-16 04:56:37.12
    const subscriptionTimeLine = subscriptionT.createdAt;

    // Add +1 month because its monthly.

    // For example : 2025-05-16 04:56:37.12
    const nextMonth = addMonths(subscriptionTimeLine, 1);

    // Get the current month's ticket count
    const currentMonthTicketsResult = await db
      .select({ value: count() })
      .from(ticketSchema) // Use schema alias
      .where(
        and(
          eq(ticketSchema.creatorId, targetInbox.userId),
          gte(ticketSchema.createdAt, subscriptionTimeLine),
          lt(ticketSchema.createdAt, nextMonth)
        )
      );

    // But what if ticket quota exceeded before this month finished? 
    // For example ticket quota finished at : 2025-04-26 04:56:37.12
    // We should avoid this by update subscription created at when user changed his subscription

    // For example : 2
    const currentMonthTicketCount = currentMonthTicketsResult[0].value;

    // Its exceeded the quota
    if(currentMonthTicketCount >= subscriptionT.ticketQuota){
      ticketData.isOverQuota = true;
    }

    // Insert the ticket into the database
    const [newTicket] = await db
      .insert(ticketSchema) // Use schema alias
      .values(ticketData)
      .returning();

    // Decrement ticket quota after ticket creation
    const [decrementQuota] = await db
      .update(subscription)
      .set({ ticketQuota: sql`${subscription.ticketQuota} - 1` })
      .where(eq(subscription.userId, targetInbox.userId));

    // Log the creation
    console.log(
      `Created new ticket: ${newTicket.id} for organization: ${targetInbox.organizationId || "N/A"}`
    );

    // Store the email content in the ticket_message table
    const [messageRecord] = await db
      .insert(ticketMessageSchema)
      .values({
        id: uuidv4(),
        content: htmlContent || textContent,
        contentType: htmlContent ? "text/html" : "text/plain",
        fromName: fromName,
        fromEmail: fromEmail,
        isInternal: false,
        isAgent: false,
        ticketId: newTicket.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log("Email content stored successfully");

    // Handle attachments if present
    if (data.attachments && data.attachments.length > 0) {
      const attachmentPromises = data.attachments.map(async (attachment) => {
        // Convert Buffer data to base64 string for local storage
        let blobString = null;
        if (attachment.content && attachment.content.data) {
          try {
            // Convert number array to Buffer and then to base64
            const buffer = Buffer.from(attachment.content.data);
            blobString = buffer.toString("base64");
            console.log(
              `Converted attachment ${attachment.filename} to base64 (${blobString.length} chars)`
            );
          } catch (err) {
            console.warn(
              `Could not convert attachment content to base64: ${err instanceof Error ? err.message : String(err)}`
            );
          }
        }

        // Insert attachment record with blob data stored directly
        return db
          .insert(ticketAttachmentSchema) // Use schema alias
          .values({
            id: uuidv4(),
            filename: attachment.filename,
            contentType: attachment.contentType,
            size: attachment.size,
            checksum: attachment.checksum,
            blobData: blobString, // Store the blob data directly in the database
            ticketId: newTicket.id,
            messageId: messageRecord.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
      });

      // Wait for all attachment insertions to complete
      const attachmentResults = await Promise.all(attachmentPromises);
      console.log(
        `Stored ${data.attachments.length} attachments directly in the database for ticket ${newTicket.id}`
      );

      // Log attachment storage details
      attachmentResults.forEach((result, index) => {
        if (result && result[0]) {
          console.log(
            `Attachment ${index + 1} stored with ID: ${result[0].id}, Size: ${result[0].size} bytes`
          );
        }
      });
    }

    return NextResponse.json({
      success: true,
      ticketId: newTicket.id,
      attachmentCount: data.attachments?.length || 0,
    });
  } catch (error) {
    console.error("Error processing inbound email:", error);
    return NextResponse.json(
      {
        error: "Failed to process email",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Parse the incoming webhook payload
    const body = (await req.json()) as ForwardEmailWebhook;

    // Process the incoming email
    return await handleInboundMail(body);
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      {
        error: "Failed to process webhook",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
