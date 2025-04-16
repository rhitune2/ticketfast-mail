import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { db, organization, ticket, ticketMessage } from "@/db";
import { streamText } from "ai";
import { eq } from "drizzle-orm";
import { extractTextFromHTML } from "@/lib/html-parse";

export const maxDuration = 30; // Allow longer duration for generation

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
        { error: "Ticket ID not provided." },
        { status: 400 }
      );
    }

    // Fetch the ticket details
    const activeTicket = await db.query.ticket.findFirst({
      where: eq(ticket.id, ticketId),
    });

    if (!activeTicket) {
      return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    }

    // Authorization check
    if (activeTicket.organizationId !== session.session.activeOrganizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch messages, order by most recent first for context priority
    const ticketMessages = await db.query.ticketMessage.findMany({
      where: eq(ticketMessage.ticketId, ticketId),
      orderBy: (ticketMessage, { desc }) => [desc(ticketMessage.createdAt)], // Most recent first
    });

    // Prepare conversation history (limiting to last 5 messages for brevity)
    const conversationHistory = await Promise.all(
      ticketMessages.slice(0, 5).map(async (msg) => {
        const sender = msg.fromName || msg.fromEmail || "Unknown";
        const plainTextContent = await extractTextFromHTML(msg.content);
        return `From: ${sender} [${msg.isAgent ? "TEAM MEMBER" : "CUSTOMER"}]: ${plainTextContent}`;
      })
    );

    const context = [
      `Ticket Subject: ${activeTicket.subject}`,
      `Ticket Status: ${activeTicket.status}`,
      `Ticket Priority: ${activeTicket.priority}`,
      `\nConversation History (most recent first):`,
      "---",
      conversationHistory.join("\n---\n"),
      "---",
    ].join("\n");

    const activeOrganization = await db.query.organization.findFirst({ where : eq(organization.id, session.session.activeOrganizationId! )})

    if(!activeOrganization){
      throw new Error("Organization not found");
    }

    const systemPrompt = `You are a helpful AI assistant for '${activeOrganization.name}', a customer support ticketing system. Your role is to draft professional and helpful replies to customer support tickets based on the conversation history. Analyze the provided ticket details and message thread, focusing on the most recent customer message or unresolved issue. Generate a potential reply that addresses the customer's query or problem effectively. Maintain a helpful and empathetic tone. Respond in HTML format suitable for an email reply body. Only output the draft reply HTML, without any extra explanation or introduction like \"Here's a draft reply:\".`;

    const userPrompt = `Generate a draft reply in HTML format for the following customer support ticket context:\n\n${context}\n\nDraft a suitable HTML reply based on this context:`;

    const result = streamText({
      // Consider using a model known for instruction following and longer text generation if needed
      model: anthropic("claude-3-7-sonnet-20250219"), // Using Haiku for speed, consider Sonnet for complex cases
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.5, // Slightly more creative than summarization
      maxTokens: 1500, // Allow for longer replies
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in generate-reply API:", error);
    return NextResponse.json(
      {
        error: "Failed to generate reply",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
