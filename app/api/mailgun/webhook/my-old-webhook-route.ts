// import { NextRequest, NextResponse } from "next/server";
// import { db } from "@/db";
// import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
// import { v4 as uuidv4 } from "uuid";
// import crypto from "crypto";
// import { 
//   ticket, 
//   ticketStatusEnum, 
//   priorityEnum, 
//   message, 
//   attachment, 
//   inbox, 
//   customer 
// } from "@/auth-schema";
// import { eq, and, isNull, isNotNull, or } from "drizzle-orm";
// import { incrementTicketUsage } from "@/lib/actions/subscription-actions";
  
// // Webhook secrets
// const MAILGUN_WEBHOOK_SIGNING_KEY = process.env.MAILGUN_API_KEY || "";
// const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

// // Mailgun API credentials
// const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
// const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;

// // S3 or storage config - Use your preferred storage solution
// const s3Client = new S3Client({
//   region: process.env.AWS_REGION || "us-east-1",
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
//   },
// });
// const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET || "";

// // Function to download attachment from Mailgun and upload to S3
// async function processAttachment(attachment: any) {
//   try {
//     if (!attachment.url) {
//       console.warn("Attachment missing URL:", attachment);
//       return {
//         fileName: attachment.filename || "attachment",
//         fileSize: attachment.size || 0,
//         fileType: attachment.contentType || "application/octet-stream",
//         filePath: "",
//       };
//     }

//     // Generate a unique filename
//     const uniqueId = uuidv4();
//     const fileName = attachment.filename || "attachment";
//     const fileExtension = fileName.includes('.') ? fileName.split('.').pop() : '';
//     const storagePath = `attachments/${uniqueId}${fileExtension ? '.' + fileExtension : ''}`;

//     // Download the attachment from Mailgun
//     const auth = Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64');
//     const response = await fetch(attachment.url, {
//       headers: {
//         Authorization: `Basic ${auth}`,
//       },
//     });

//     if (!response.ok) {
//       throw new Error(`Failed to download attachment: ${response.statusText}`);
//     }

//     // Get the file content
//     const fileBuffer = await response.arrayBuffer();

//     // Option 1: If using S3 or similar cloud storage
//     if (S3_BUCKET_NAME) {
//       await s3Client.send(
//         new PutObjectCommand({
//           Bucket: S3_BUCKET_NAME,
//           Key: storagePath,
//           Body: Buffer.from(fileBuffer),
//           ContentType: attachment.contentType || "application/octet-stream",
//         })
//       );

//       // Return the S3 URL or path to the file
//       const fileUrl = `https://${S3_BUCKET_NAME}.s3.amazonaws.com/${storagePath}`;
      
//       return {
//         fileName: attachment.filename || "attachment",
//         fileSize: attachment.size || 0,
//         fileType: attachment.contentType || "application/octet-stream",
//         filePath: fileUrl,
//       };
//     } 
//     // Option 2: If using local file storage (for development)
//     else {
//       console.warn("S3 bucket not configured, attachment URLs may not work properly");
//       // For production, ensure you have proper storage configured
//       // This is just a fallback that won't work in most production setups
//       return {
//         fileName: attachment.filename || "attachment",
//         fileSize: attachment.size || 0,
//         fileType: attachment.contentType || "application/octet-stream",
//         filePath: attachment.url, // Still using Mailgun URL as fallback
//         content: Buffer.from(fileBuffer).toString('base64'), // Store base64 content directly
//       };
//     }
//   } catch (error) {
//     console.error("Error processing attachment:", error);
//     return {
//       fileName: attachment.filename || "attachment",
//       fileSize: attachment.size || 0,
//       fileType: attachment.contentType || "application/octet-stream",
//       filePath: "",
//       error: error instanceof Error ? error.message : "Unknown error",
//     };
//   }
// }

// export async function POST(req: NextRequest) {
//   try {
//     // Get headers for Mailgun verification
//     const signature = req.headers.get("x-mailgun-signature");
//     const timestamp = req.headers.get("x-mailgun-timestamp") || req.headers.get("timestamp");
//     const token = req.headers.get("x-mailgun-token") || req.headers.get("token");
    
//     // Clone the request to read the body multiple times if needed
//     const clonedReq = req.clone();
    
//     // Parse the email data from the webhook payload
//     const formData = await req.formData();
//     const data: Record<string, any> = {};
    
//     // Convert FormData to a regular object and handle arrays
//     for (const [key, value] of formData.entries()) {
//       if (data[key]) {
//         // If this key already exists, convert to array or push to existing array
//         if (Array.isArray(data[key])) {
//           data[key].push(value);
//         } else {
//           data[key] = [data[key], value];
//         }
//       } else {
//         data[key] = value;
//       }
//     }
    
//     console.log("Received webhook payload:", JSON.stringify(data, null, 2));
    
//     // If we have signature headers from Mailgun, verify the signature
//     if (signature && timestamp && token && MAILGUN_WEBHOOK_SIGNING_KEY) {
//       // Create the signature string as per Mailgun docs
//       const signingString = timestamp + token;
      
//       // Generate the HMAC signature
//       const hmac = crypto.createHmac('sha256', MAILGUN_WEBHOOK_SIGNING_KEY);
//       hmac.update(signingString);
//       const expectedSignature = hmac.digest('hex');
      
//       // Compare signatures
//       if (signature !== expectedSignature) {
//         console.error("Invalid Mailgun webhook signature");
//         return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
//       }
      
//       console.log("Mailgun webhook signature verified");
//     }
    
//     // Process message-headers if available
//     let headers: Record<string, string> = {};
//     if (data['message-headers']) {
//       try {
//         // The headers might be a JSON string of arrays
//         const headerArrays = JSON.parse(data['message-headers']);
        
//         // Convert header arrays to an object
//         headers = headerArrays.reduce((acc: Record<string, string>, [name, value]: [string, string]) => {
//           acc[name.toLowerCase()] = value;
//           return acc;
//         }, {});
//       } catch (e) {
//         console.warn("Could not parse message headers", e);
//       }
//     }
    
//     // Extract email threading headers
//     const messageId = headers['message-id'] || '';
//     const inReplyTo = headers['in-reply-to'] || '';
//     const references = headers['references'] || '';
    
//     console.log("Email threading headers:", { messageId, inReplyTo, references });
    
//     // Extract email data based on Mailgun format
//     const fromHeader = data.from || headers.from || '';
//     let fromEmail = '';
//     let fromName = '';
    
//     // Extract name and email from "Name <email>" format if available
//     if (typeof fromHeader === 'string') {
//       const fromMatch = fromHeader.match(/^(?:(.*?)\s*<(.+?)>|(.+))$/);
//       if (fromMatch) {
//         if (fromMatch[2]) {
//           // Format was "Name <email>"
//           fromName = fromMatch[1]?.trim() || '';
//           fromEmail = fromMatch[2].trim();
//         } else {
//           // Format was just "email"
//           fromEmail = fromMatch[3].trim();
//         }
//       } else {
//         // Fallback to the raw value
//         fromEmail = fromHeader;
//       }
//     }
    
//     // Determine webhook source and process accordingly
//     if (data['event-data'] && data['event-data'].event === 'inbound') {
//       // This is a Mailgun event webhook
//       return handleMailgunWebhook(data);
//     } else {
//       // This is a generic email webhook (like Mailtrap)
//       return handleGenericWebhook(data);
//     }
//   } catch (error) {
//     console.error("Error processing webhook:", error);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }

// // Handle Mailgun webhook format
// async function handleMailgunWebhook(data: any) {
//   try {
//     const eventData = data['event-data'];
//     if (!eventData) {
//       return NextResponse.json({ error: "Invalid Mailgun webhook payload" }, { status: 400 });
//     }
    
//     const storage = eventData.storage || {};
//     const message = eventData.message || {};
//     const recipient = message.recipients?.[0] || '';
    
//     // Extract email data
//     const emailData = {
//       fromEmail: message.sender?.split('<')?.[1]?.split('>')?.[0] || message.sender || '',
//       fromName: message.sender?.split('<')?.[0]?.trim() || '',
//       toEmail: recipient,
//       subject: message.headers?.subject || '',
//       text: storage.url ? await fetchMailgunStoredMessage(storage.url, 'text') : '',
//       html: storage.url ? await fetchMailgunStoredMessage(storage.url, 'html') : '',
//       attachments: message.attachments || [],
//       messageId: message.headers?.['message-id'] || '',
//       inReplyTo: message.headers?.['in-reply-to'] || '',
//       references: message.headers?.references || '',
//     };
    
//     // Process the email
//     const result = await processEmail(emailData);
//     return NextResponse.json(result);
//   } catch (error) {
//     console.error("Error handling Mailgun webhook:", error);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }

// // Handle generic webhook format (like Mailtrap)
// async function handleGenericWebhook(data: any) {
//   try {
//     // Extract email data from the generic webhook format
//     const emailData = {
//       fromEmail: data.sender_email || data.from || '',
//       fromName: data.sender_name || '',
//       toEmail: data.recipient || data.to || '',
//       ccEmails: data.cc || '',
//       bccEmails: data.bcc || '',
//       subject: data.subject || '',
//       text: data.text || data['body-plain'] || '',
//       html: data.html || data['body-html'] || '',
//       attachments: data.attachments || [],
//       messageId: data['message-id'] || '',
//       inReplyTo: data['in-reply-to'] || '',
//       references: data.references || '',
//     };
    
//     // Process the email
//     const result = await processEmail(emailData);
//     return NextResponse.json(result);
//   } catch (error) {
//     console.error("Error handling generic webhook:", error);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }

// // Fetch stored message content from Mailgun
// async function fetchMailgunStoredMessage(url: string, format: 'html' | 'text') {
//   try {
//     const auth = Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64');
//     const response = await fetch(url, {
//       headers: {
//         Authorization: `Basic ${auth}`,
//         Accept: format === 'html' ? 'text/html' : 'text/plain',
//       },
//     });
    
//     if (!response.ok) {
//       throw new Error(`Failed to fetch message content: ${response.statusText}`);
//     }
    
//     return await response.text();
//   } catch (error) {
//     console.error(`Error fetching ${format} content:`, error);
//     return '';
//   }
// }

// // Common email processing logic for all webhook sources
// async function processEmail(emailData: {
//   fromEmail: string;
//   fromName: string;
//   toEmail: string;
//   ccEmails?: string;
//   bccEmails?: string;
//   subject?: string;
//   text?: string;
//   html?: string;
//   attachments?: any[];
//   messageId?: string;
//   inReplyTo?: string;
//   references?: string;
// }) {
//   try {
//     console.log("Processing email:", JSON.stringify(emailData, null, 2));
    
//     // Validate required fields
//     if (!emailData.fromEmail || !emailData.toEmail) {
//       throw new Error("Missing required email fields");
//     }
    
//     // Find the inbox by email address
//     const inboxes = await db.select()
//       .from(inbox)
//       .where(eq(inbox.emailAddress, emailData.toEmail));
    
//     if (!inboxes || inboxes.length === 0) {
//       console.error(`No inbox found for email address: ${emailData.toEmail}`);
//       return { error: "Inbox not found" };
//     }
    
//     const targetInbox = inboxes[0];
    
//     // Check if this is a reply to an existing ticket
//     let existingTicketId: string | null = null;
    
//     if (emailData.inReplyTo || emailData.references) {
//       // Try to find a message with matching message-id
//       const messageIds = [
//         ...(emailData.inReplyTo ? [emailData.inReplyTo] : []),
//         ...(emailData.references ? emailData.references.split(/\s+/) : []),
//       ].filter(Boolean);
      
//       if (messageIds.length > 0) {
//         // This logic would need to be adapted based on how you store message IDs
//         // For now, we'll assume you have a way to look up tickets by message ID
//         // This is a placeholder - implement according to your schema
//         console.log("Looking for existing ticket with message IDs:", messageIds);
        
//         // This is a simplified approach - you might need to adjust based on your schema
//         // In a real implementation, you'd search for messages that have these IDs
//         // For now, we'll just log this information
//       }
//     }
    
//     // Look up or create customer
//     let customerRecord = null;
    
//     if (emailData.fromEmail) {
//       // Check if customer exists
//       let existingCustomers;
      
//       // Handle organization filtering based on whether organizationId exists
//       if (targetInbox.organizationId) {
//         existingCustomers = await db.select()
//           .from(customer)
//           .where(and(
//             eq(customer.email, emailData.fromEmail),
//             eq(customer.organizationId, targetInbox.organizationId)
//           ));
//       } else {
//         existingCustomers = await db.select()
//           .from(customer)
//           .where(and(
//             eq(customer.email, emailData.fromEmail),
//             isNull(customer.organizationId)
//           ));
//       }
      
//       if (existingCustomers && existingCustomers.length > 0) {
//         customerRecord = existingCustomers[0];
//       }
      
//       // If no customer found, create a new one
//       if (!customerRecord) {
//         // Create new customer with proper handling of null/undefined values
//         const customerData: any = {
//           id: uuidv4(),
//           email: emailData.fromEmail,
//           fullName: emailData.fromName,
//           firstName: emailData.fromName.split(' ')[0] || '',
//           lastName: emailData.fromName.split(' ').slice(1).join(' ') || '',
//           createdAt: new Date(),
//           updatedAt: new Date()
//         };
        
//         // Only add organizationId if it exists
//         if (targetInbox.organizationId) {
//           customerData.organizationId = targetInbox.organizationId;
//         }
        
//         const [newCustomer] = await db.insert(customer)
//           .values(customerData)
//           .returning();
        
//         customerRecord = newCustomer;
//       }
//     }
    
//     let ticketRecord;
//     let isNewTicket = false;
    
//     // If this is a reply to an existing ticket, find that ticket
//     if (existingTicketId) {
//       const existingTickets = await db.select()
//         .from(ticket)
//         .where(eq(ticket.id, existingTicketId));
      
//       if (existingTickets && existingTickets.length > 0) {
//         ticketRecord = existingTickets[0];
        
//         // Update ticket status if it was closed
//         if (ticketRecord.status === 'CLOSED') {
//           await db.update(ticket)
//             .set({
//               status: 'NEEDS_ATTENTION',
//               updatedAt: new Date()
//             })
//             .where(eq(ticket.id, ticketRecord.id));
          
//           ticketRecord.status = 'NEEDS_ATTENTION';
//         }
//       }
//     }
    
//     // If no existing ticket found, create a new one
//     if (!ticketRecord) {
//       isNewTicket = true;
      
//       // Create new ticket with proper handling of null/undefined values
//       const ticketData: any = {
//         id: uuidv4(),
//         subject: emailData.subject || '(No Subject)',
//         status: 'UNASSIGNED',
//         priority: 'NORMAL',
//         fromEmail: emailData.fromEmail,
//         fromName: emailData.fromName,
//         toEmail: emailData.toEmail,
//         ccEmails: emailData.ccEmails || '',
//         bccEmails: emailData.bccEmails || '',
//         inboxId: targetInbox.id,
//         createdAt: new Date(),
//         updatedAt: new Date()
//       };
      
//       // Only add customerId if it exists
//       if (customerRecord?.id) {
//         ticketData.customerId = customerRecord.id;
//       }
      
//       // Only add organizationId if it exists
//       if (targetInbox.organizationId) {
//         ticketData.organizationId = targetInbox.organizationId;
//       }
      
//       const [newTicket] = await db.insert(ticket)
//         .values(ticketData)
//         .returning();
      
//       ticketRecord = newTicket;
      
//       // Increment ticket usage for the organization
//       if (targetInbox.organizationId) {
//         await incrementTicketUsage(targetInbox.organizationId);
//       }
//     }
    
//     // Create message for the ticket
//     const [messageRecord] = await db.insert(message)
//       .values({
//         id: uuidv4(),
//         content: emailData.html || emailData.text || '',
//         contentType: emailData.html ? 'text/html' : 'text/plain',
//         isInternal: false,
//         fromName: emailData.fromName,
//         fromEmail: emailData.fromEmail,
//         isAgent: false,
//         ticketId: ticketRecord.id,
//         createdAt: new Date(),
//         updatedAt: new Date()
//       })
//       .returning();
    
//     // Process attachments if any
//     const attachmentRecords = [];
    
//     if (emailData.attachments && emailData.attachments.length > 0) {
//       for (const attachmentData of emailData.attachments) {
//         const processedAttachment = await processAttachment(attachmentData);
        
//         if (processedAttachment) {
//           const attachmentValues: any = {
//             id: uuidv4(),
//             fileName: processedAttachment.fileName,
//             fileSize: processedAttachment.fileSize,
//             fileType: processedAttachment.fileType,
//             filePath: processedAttachment.filePath,
//             messageId: messageRecord.id,
//             ticketId: ticketRecord.id,
//             createdAt: new Date(),
//             updatedAt: new Date()
//           };
          
//           // Only add content if it exists
//           if (processedAttachment.content) {
//             attachmentValues.content = processedAttachment.content;
//           }
          
//           const [attachmentRecord] = await db.insert(attachment)
//             .values(attachmentValues)
//             .returning();
          
//           attachmentRecords.push(attachmentRecord);
//         }
//       }
//     }
    
//     return {
//       success: true,
//       ticket: ticketRecord,
//       message: messageRecord,
//       attachments: attachmentRecords,
//       isNewTicket
//     };
//   } catch (error) {
//     console.error("Error processing email:", error);
//     return { error: "Failed to process email", details: error instanceof Error ? error.message : String(error) };
//   }
// }