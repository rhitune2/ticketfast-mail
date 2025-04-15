import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/db";
import { ticket, inbox, contact } from "@/db-schema";
import { ticketMessage } from "@/db-schema";
import { eq, and, isNull } from "drizzle-orm";

const MAILGUN_WEBHOOK_SIGNING_KEY = process.env.MAILGUN_API_KEY || "";
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;

// Interface defining the structure of Mailgun webhook data
interface MailgunData {
  from?: string;
  sender?: string;
  subject?: string;
  "body-html"?: string;
  "body-plain"?: string;
  "stripped-html"?: string;
  "stripped-text"?: string;
  recipient?: string;
  "message-headers"?: string;
  "message-id"?: string;
  "in-reply-to"?: string;
  references?: string;
  "Content-Type"?: string;
  "Content-Transfer-Encoding"?: string;
  timestamp?: string;
  token?: string;
  signature?: string;
  [key: string]: any; // For any other fields that might be present
}

/**
 * Handles inbound mail processing from Mailgun webhook
 * Parses the email data and stores it in the database
 */
async function handleInboundMail(data: MailgunData) {
  try {
    console.log("Processing inbound email");
    
    // Extract email information
    const fromHeader = data.from || '';
    let fromEmail = '';
    let fromName = '';
    
    // Parse the 'from' header to extract name and email address
    if (typeof fromHeader === 'string') {
      const fromMatch = fromHeader.match(/^(?:(.*?)\s*<(.+?)>|(.+))$/);
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
      } else {
        fromEmail = fromHeader;
        fromName = fromHeader.split('@')[0] || '';
      }
    }
    
    const toEmail = data.recipient || '';
    const subject = data.subject || '(No Subject)';
    
    // Get HTML content, preferring body-html over stripped-html
    const htmlContent = data["body-html"] || data["stripped-html"] || '';
    const textContent = data["body-plain"] || data["stripped-text"] || '';
    
    // Parse message headers if available
    let headers: Record<string, string> = {};
    if (data['message-headers']) {
      try {
        const headerArrays = JSON.parse(data['message-headers']);
        
        // Convert header arrays to an object
        headers = headerArrays.reduce((acc: Record<string, string>, [name, value]: [string, string]) => {
          acc[name.toLowerCase()] = value;
          return acc;
        }, {});
      } catch (e) {
        console.warn("Could not parse message headers", e);
      }
    }
    
    // Get email threading information
    const messageId = data["message-id"] || headers['message-id'] || '';
    const inReplyTo = headers['in-reply-to'] || '';
    const references = headers['references'] || '';
    
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
    
    // Ticket usage tracking would be implemented here
    // For now, we'll just log the creation
    console.log(`Created new ticket: ${ticketRecord.id} for organization: ${targetInbox.organizationId || 'N/A'}`);
    
    // Store the email content in the ticket_message table
    await db.insert(ticketMessage)
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
      });
    
    console.log("Email content stored successfully");
    
    return NextResponse.json({ 
      success: true, 
      ticketId: ticketRecord.id 
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
    const signature = req.headers.get("x-mailgun-signature");
    const timestamp =
      req.headers.get("x-mailgun-timestamp") || req.headers.get("timestamp");
    const token = req.headers.get("x-mailgun-token") || req.headers.get("token");

    // Verify webhook signature if available
    if (signature && timestamp && token && MAILGUN_WEBHOOK_SIGNING_KEY) {
      // Create the signature string as per Mailgun docs
      const signingString = timestamp + token;

      // Generate the HMAC signature
      const hmac = crypto.createHmac("sha256", MAILGUN_WEBHOOK_SIGNING_KEY);
      hmac.update(signingString);
      const expectedSignature = hmac.digest("hex");

      // Compare signatures
      if (signature !== expectedSignature) {
        console.error("Invalid Mailgun webhook signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }

      console.log("Mailgun webhook signature verified");
    }

    // Parse the form data from the webhook payload
    const formData = await req.formData();
    const data: Record<string, any> = {};

    // Convert FormData to a regular object and handle arrays
    for (const [key, value] of formData.entries()) {
      if (data[key]) {
        // If this key already exists, convert to array or push to existing array
        if (Array.isArray(data[key])) {
          data[key].push(value);
        } else {
          data[key] = [data[key], value];
        }
      } else {
        data[key] = value;
      }
    }

    // Process the incoming email
    return await handleInboundMail(data as MailgunData);
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({ 
      error: "Failed to process webhook", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
