import { NextRequest, NextResponse } from "next/server";

// Define interface for email data based on forward-email webhook structure
interface ForwardEmailWebhook {
  attachments?: Array<{
    type: string;
    content: any;
    contentType: string;
    filename: string;
    size: number;
  }>;
  from?: {
    value: Array<{
      address: string;
      name: string;
    }>;
    text: string;
  };
  html?: string;
  text?: string;
  date?: string;
  messageId?: string;
  subject?: string;
  recipients?: string[];
  session?: {
    recipient: string;
    sender: string;
    mta: string;
    arrivalDate: string;
  };
  headerLines?: Array<{
    key: string;
    line: string;
  }>;
}

export async function POST(req: NextRequest) {
  try {
    // Parse the incoming webhook payload
    const body = await req.json() as ForwardEmailWebhook;
    
    // Log the email information
    console.log('=== Forward Email Webhook Received ===');
    console.log('From:', body.from?.text || 'Unknown sender');
    console.log('Recipients:', body.recipients || []);
    console.log('Date:', body.date || 'Unknown date');
    console.log('MessageID:', body.messageId || 'No message ID');
    console.log('Subject:', body.subject || 'No subject');
    
    // Log attachment information if present
    if (body.attachments && body.attachments.length > 0) {
      console.log('=== Attachments ===');
      body.attachments.forEach((attachment, index) => {
        console.log(`Attachment ${index + 1}:`, {
          filename: attachment.filename,
          contentType: attachment.contentType,
          size: attachment.size
        });
      });
    }
    
    // Log email body content
    console.log('=== Email Content ===');
    console.log('Text:', body.text || 'No text content');
    console.log('HTML:', body.html ? 'HTML content available' : 'No HTML content');
    
    // Here you would process the email data according to your application logic
    // For now, we're just logging the data as requested
    
    // Return a success response
    return NextResponse.json({
      success: true,
      message: 'Webhook received and processed'
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process webhook'
    }, { status: 500 });
  }
}
