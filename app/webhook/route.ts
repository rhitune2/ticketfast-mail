import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/db";
import { ticket, inbox, contact, ticketMessage, ticketAttachment } from "@/db-schema";
import { eq, and, isNull } from "drizzle-orm";

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

/**
 * Handles inbound mail processing from forward-email webhook
 * Parses the email data and stores it in the database
 */
async function handleInboundMail(data: ForwardEmailWebhook) {
  try {
    console.log("Processing inbound email from forward-email");
    
    // Extract email information
    let fromEmail = '';
    let fromName = '';
    
    // Parse the 'from' field
    if (data.from?.value && data.from.value.length > 0) {
      fromEmail = data.from.value[0].address;
      fromName = data.from.value[0].name || fromEmail.split('@')[0];
    } else if (data.from?.text) {
      // Fallback to text representation
      const fromMatch = data.from.text.match(/^(?:(.*?)\s*<(.+?)>|(.+))$/);
      if (fromMatch) {
        if (fromMatch[2]) {
          // Format was "Name <email>"
          fromName = fromMatch[1]?.trim() || '';
          fromEmail = fromMatch[2].trim();
        } else {
          // Format was just email
          fromEmail = fromMatch[3].trim();
          fromName = fromEmail.split('@')[0] || '';
        }
      }
    }
    
    // Get recipient email
    const toEmail = data.recipients?.[0] || data.session?.recipient || '';
    if (!toEmail) {
      console.error("No recipient found in the email data");
      return NextResponse.json({ error: "No recipient found" }, { status: 400 });
    }
    
    const subject = data.subject || '(No Subject)';
    
    // Get HTML and text content
    const htmlContent = data.html || data.textAsHtml || '';
    const textContent = data.text || '';
    
    // Find the inbox by email address
    const inboxes = await db.select()
      .from(inbox)
      .where(eq(inbox.emailAddress, toEmail));
    
    if (!inboxes || inboxes.length === 0) {
      console.error(`No inbox found for email address: ${toEmail}`);
      return NextResponse.json({ error: "Inbox not found" }, { status: 404 });
    }
    
    const targetInbox = inboxes[0];
    
    // Look up or create contact
    let contactRecord = null;
    
    if (fromEmail) {
      // Check if contact exists
      let existingContacts;
      
      // Handle organization filtering based on whether organizationId exists
      if (targetInbox.organizationId) {
        existingContacts = await db.select()
          .from(contact)
          .where(and(
            eq(contact.email, fromEmail),
            eq(contact.organizationId, targetInbox.organizationId)
          ));
      } else {
        existingContacts = await db.select()
          .from(contact)
          .where(and(
            eq(contact.email, fromEmail),
            isNull(contact.organizationId)
          ));
      }
      
      if (existingContacts && existingContacts.length > 0) {
        contactRecord = existingContacts[0];
      }
      
      // If no contact found, create a new one
      if (!contactRecord) {
        // Create new contact
        const contactData: any = {
          id: uuidv4(),
          email: fromEmail,
          fullName: fromName,
          firstName: fromName.split(' ')[0] || '',
          lastName: fromName.split(' ').slice(1).join(' ') || '',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Only add organizationId if it exists
        if (targetInbox.organizationId) {
          contactData.organizationId = targetInbox.organizationId;
        }
        
        const [newContact] = await db.insert(contact)
          .values(contactData)
          .returning();
        
        contactRecord = newContact;
      }
    }
    
    // Create a new ticket
    const ticketData: any = {
      id: uuidv4(),
      subject: subject,
      status: 'UNASSIGNED',
      priority: 'NORMAL',
      fromEmail: fromEmail,
      fromName: fromName,
      toEmail: toEmail,
      inboxId: targetInbox.id,
      creatorId: targetInbox.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add contact reference if available
    if (contactRecord?.id) {
      ticketData.contactId = contactRecord.id;
    }
    
    // Add organization reference if available
    if (targetInbox.organizationId) {
      ticketData.organizationId = targetInbox.organizationId;
    }
    
    // Insert the ticket into the database
    const [ticketRecord] = await db.insert(ticket)
      .values(ticketData)
      .returning();
    
    // Log the creation
    console.log(`Created new ticket: ${ticketRecord.id} for organization: ${targetInbox.organizationId || 'N/A'}`);
    
    // Store the email content in the ticket_message table
    const [messageRecord] = await db.insert(ticketMessage)
      .values({
        id: uuidv4(),
        content: htmlContent || textContent,
        contentType: htmlContent ? 'text/html' : 'text/plain',
        fromName: fromName,
        fromEmail: fromEmail,
        isInternal: false,
        isAgent: false,
        ticketId: ticketRecord.id,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    console.log("Email content stored successfully");
    
    // Handle attachments if present
    if (data.attachments && data.attachments.length > 0) {
      const attachmentPromises = data.attachments.map(async (attachment) => {
        // Convert Buffer data to base64 string if needed
        let contentString = null;
        if (attachment.content && attachment.content.data) {
          try {
            // Convert number array to Buffer and then to base64
            const buffer = Buffer.from(attachment.content.data);
            contentString = buffer.toString('base64');
          } catch (err) {
            console.warn("Could not convert attachment content to string", err);
          }
        }
        
        // Insert attachment record
        return db.insert(ticketAttachment)
          .values({
            id: uuidv4(),
            filename: attachment.filename,
            contentType: attachment.contentType,
            size: attachment.size,
            checksum: attachment.checksum,
            content: contentString, // Store small attachments directly
            ticketId: ticketRecord.id,
            messageId: messageRecord.id,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
      });
      
      // Wait for all attachment insertions to complete
      await Promise.all(attachmentPromises);
      console.log(`Stored ${data.attachments.length} attachments for ticket ${ticketRecord.id}`);
    }
    
    return NextResponse.json({ 
      success: true, 
      ticketId: ticketRecord.id,
      attachmentCount: data.attachments?.length || 0
    });
  } catch (error) {
    console.error("Error processing inbound email:", error);
    return NextResponse.json({ 
      error: "Failed to process email", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Parse the incoming webhook payload
    const body = await req.json() as ForwardEmailWebhook;
    
    // Log the email information for debugging
    console.log('=== Forward Email Webhook Received ===');
    console.log('From:', body.from?.text || 'Unknown sender');
    console.log('Recipients:', body.recipients || []);
    console.log('Date:', body.date || 'Unknown date');
    console.log('MessageID:', body.messageId || 'No message ID');
    console.log('Subject:', body.subject || 'No subject');
    
    // Log attachment information if present
    if (body.attachments && body.attachments.length > 0) {
      console.log(`Found ${body.attachments.length} attachments`);
      body.attachments.forEach((attachment, index) => {
        console.log(`Attachment ${index + 1}:`, {
          filename: attachment.filename,
          contentType: attachment.contentType,
          size: attachment.size
        });
      });
    }
    
    // Process the incoming email
    return await handleInboundMail(body);
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({ 
      error: "Failed to process webhook", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
