import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { db, ticket, ticketMessage } from "@/db";
import { streamText } from "ai";
import { eq } from "drizzle-orm";
import { extractTextFromHTML } from "@/lib/html-parse";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { ticketId } = body;

    if (!ticketId) {
      return NextResponse.json(
        { error: "Ticket ID not found." },
        { status: 404 }
      );
    }

    const activeTicket = await db.query.ticket.findFirst({
      where: eq(ticket.id, ticketId),
    });

    if (!activeTicket) {
      return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    }

    if (activeTicket.organizationId !== session.session.activeOrganizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ticketMessages = await db.query.ticketMessage.findMany({
      where: eq(ticketMessage.ticketId, ticketId),
      orderBy: (ticketMessage, { asc }) => [asc(ticketMessage.createdAt)],
    });

    const filteredMessages = ticketMessages.map(async (message) => {
      return {
        fromName: message.fromName,
        fromEmail: message.fromEmail,
        content: await extractTextFromHTML(message.content),
      };
    });

    // Combine ticket subject and messages for summarization
    const ticketContent = [
      `Subject: ${activeTicket.subject}`,
      `Status: ${activeTicket.status}`,
      `Priority: ${activeTicket.priority}`,
      `From: ${activeTicket.fromName} <${activeTicket.fromEmail}>`,
      `To: ${activeTicket.toEmail}`,
      "\nMessages:",
      ...ticketMessages.map(
        (msg) =>
          `From: ${msg.fromName || "Unknown"} <${msg.fromEmail || "Unknown"}>\n${msg.content}`
      ),
    ].join("\n");

    // Format the prompt for the AI
    const prompt = `Summarize this ticket information. Provide the key points:\n\n${ticketContent} and just send summary. Do not add any additional text or formatting.`;

    // Generate the streaming response
    const result = streamText({
      model: anthropic("claude-3-7-sonnet-20250219"),
      system:
        "You are a helpful AI assistant that summarizes customer support tickets for TicketFast AI Intelligence Ticket Managing System. Provide clear, concise, Provide a concise summary (2-3 sentences) that captures the main issue, any key details, and the current status of the conversation.",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      maxTokens: 1000,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in summarize API:", error);
    return NextResponse.json(
      {
        error: "Failed to generate summary",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
