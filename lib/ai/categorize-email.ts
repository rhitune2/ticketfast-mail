import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import { TAGS } from "../constants";

// Define the supported ticket statuses
type TicketStatus = "ASSIGNED" | "UNASSIGNED" | "WAITING" | "CLOSED";

// Define the supported priority levels
type TicketPriority = "LOW" | "NORMAL" | "MEDIUM" | "HIGH";

// Define the types for the categorization input and output
interface CategorizeEmailInput {
  emailContent: string;
  subject: string;
  fromName?: string;
  fromEmail?: string;
}

interface CategorizeEmailOutput {
  status: TicketStatus;
  priority: TicketPriority;
  tag: string | null;
  analysis: {
    confidence: number;
    reasoning: string;
  };
}

/**
 * Categorizes an email to determine its status, priority, and tags based on content analysis
 *
 * @param input The email content and subject to analyze
 * @returns An object containing recommended status, priority, tag, and analysis details
 */
export async function categorizeEmail(
  input: CategorizeEmailInput
): Promise<CategorizeEmailOutput> {
  try {
    // Define the system prompt for Claude
    const systemPrompt = 
      "You are a ticket categorization system for a customer support team. " +
      "Analyze incoming emails to classify them by status, priority, and assign appropriate tags. " +
      "Your analysis should be objective, practical, and based on the email content. " +
      "Provide both a classification and a brief explanation of your reasoning.";

    // Format email details for the prompt
    const emailDetails = [
      `Subject: ${input.subject}`,
      `From: ${input.fromName ? input.fromName + " " : ""}${input.fromEmail ? "<" + input.fromEmail + ">" : ""}`,
      "",
      "Email Content:",
      input.emailContent,
    ].join("\n");

    // Create the user prompt with classification instructions
    const userPrompt = [
      "Analyze this email and categorize it for our ticket system:",
      "",
      emailDetails,
      "",
      "Please determine the following:",
      "",
      "1. Is this spam? If so, provide a confidence score (0-1).",
      "",
      "2. Status (select one):",
      "- ASSIGNED: The ticket should be assigned to someone immediately",
      "- UNASSIGNED: The ticket should be placed in the queue for assignment",
      "- WAITING: The ticket requires additional information before proceeding",
      "- CLOSED: The ticket can be closed immediately (e.g., spam, automated messages)",
      "",
      "3. Priority (select one):",
      "- LOW: Not time-sensitive, can be handled when convenient",
      "- NORMAL: Standard priority, should be handled in the normal flow",
      "- MEDIUM: Needs attention soon, but not urgent",
      "- HIGH: Time-sensitive issue requiring prompt attention",
      "",
      "4. Tag (select the MOST appropriate single tag, or NONE if none apply):",
      TAGS.map((tag) => `- ${tag}`).join("\n"),
      "- NONE",
      "",
      "Return your analysis as a structured JSON object.",
    ].join("\n");

    // Define the schema for validating AI response
    const analysisSchema = z.object({
      isSpam: z.boolean(),
      spamConfidence: z.number().min(0).max(1),
      suggestedStatus: z.enum(["ASSIGNED", "UNASSIGNED", "WAITING", "CLOSED"]),
      suggestedPriority: z.enum(["LOW", "NORMAL", "MEDIUM", "HIGH"]),
      suggestedTag: z.union([
        z.enum(TAGS as [string, ...string[]]),
        z.literal("NONE"),
      ]),
      confidence: z.number().min(0).max(1),
      reasoning: z.string(),
    });

    // Generate the analysis using Anthropic's Claude model
    const { object: emailAnalysis } = await generateObject({
      model: anthropic("claude-3-7-sonnet-20250219"), // Using Haiku for faster responses
      schema: analysisSchema,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.2, // Low temperature for consistent categorization
      maxTokens: 1000,
    });

    // Process the analysis results
    let status: TicketStatus = emailAnalysis.suggestedStatus;
    let priority: TicketPriority = emailAnalysis.suggestedPriority;
    let tag: string | null =
      emailAnalysis.suggestedTag === "NONE" ? null : emailAnalysis.suggestedTag;

    // Override rules - for consistent handling of specific cases
    if (emailAnalysis.isSpam && emailAnalysis.spamConfidence > 0.7) {
      status = "CLOSED";
      priority = "LOW";
      tag = "SPAM";
    }

    // Special handling for urgent requests
    if (tag === "URGENT" && priority !== "HIGH") {
      priority = "HIGH";
    }

    return {
      status,
      priority,
      tag,
      analysis: {
        confidence: emailAnalysis.confidence,
        reasoning: emailAnalysis.reasoning,
      },
    };
  } catch (error) {
    console.error("Error in categorizeEmail:", error);

    // Return default values if an error occurs
    return {
      status: "UNASSIGNED",
      priority: "NORMAL",
      tag: null,
      analysis: {
        confidence: 0,
        reasoning: "Error occurred during categorization",
      },
    };
  }
}
