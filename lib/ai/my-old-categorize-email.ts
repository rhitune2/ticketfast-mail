import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { generateText, generateObject } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { prisma } from '@/prisma';


// Define the input type for the categorization function
interface CategorizeEmailInput {
    emailContent: string;
    subject: string;
    inboxId: string;
}

// Define the output type for the categorization function
interface CategorizeEmailOutput {
    suggestedTags: Array<{
        id: string;
        name: string;
        confidence: number;
    }>;
    analysis: {
        priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
        sentiment: string;
        summary: string;
        language: string;
    };
}

export async function POST(req: Request) {
    try {
        // Parse the request body
        const body = await req.json();
        const { emailContent, subject, inboxId } = body as CategorizeEmailInput;

        if (!emailContent || !subject || !inboxId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get the categorization result
        const result = await categorizeEmail({ emailContent, subject, inboxId });

        // Return the result
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error categorizing email:', error);
        return NextResponse.json(
            { error: 'Failed to categorize email' },
            { status: 500 }
        );
    }
}

async function categorizeEmail(input: CategorizeEmailInput): Promise<CategorizeEmailOutput> {
    const model = google('gemini-1.5-pro-latest');
    // const model = openai('gpt-4o-mini');

    // Step 0: Detect the language of the email
    const { object: languageDetection } = await generateObject({
        model,
        schema: z.object({
            detectedLanguage: z.string(),
            languageCode: z.string(),
            confidence: z.number().min(0).max(1),
        }),
        prompt: `Detect the language of this email:

Subject: ${input.subject}

Email Content:
${input.emailContent}

Analyze the text and determine:
1. The full name of the language (e.g., "English", "Spanish", "Turkish", etc.)
2. The ISO language code (e.g., "en", "es", "tr", etc.)
3. Your confidence level in this detection (0-1)

Return only these three pieces of information.`,
    });

    // Step 1: Validate email content and check for spam
    const { object: contentValidation } = await generateObject({
        model,
        schema: z.object({
            isSpam: z.boolean(),
            isContentRelevantToSubject: z.boolean(),
            spamConfidence: z.number().min(0).max(1),
            reasonForClassification: z.string(),
        }),
        prompt: `Analyze this email and determine if it's spam or if the content doesn't match the subject:

Subject: ${input.subject}

Email Content:
${input.emailContent}

Instructions:
1. Evaluate if this email is spam, gibberish, or nonsensical content
2. Check if the email content is actually relevant to the subject
3. Provide a confidence score (0-1) for your spam classification
4. Explain your reasoning briefly

Note: Look for signs like random characters, nonsensical text, excessive punctuation, or content that clearly doesn't relate to the subject.`,
    });

    // If the content is detected as spam or irrelevant to the subject, handle it specially
    if (contentValidation.isSpam || !contentValidation.isContentRelevantToSubject) {
        // Fetch available tags for the inbox
        const availableTags = await prisma.tag.findMany({
            where: {
                inboxId: input.inboxId,
            },
            select: {
                id: true,
                name: true,
                color: true,
            },
        });

        // If there are no tags, return without suggesting any
        if (!availableTags.length) {
            return {
                suggestedTags: [],
                analysis: {
                    priority: 'LOW',
                    sentiment: 'neutral',
                    summary: contentValidation.isSpam
                        ? `This appears to be spam content (${Math.round(contentValidation.spamConfidence * 100)}% confidence). ${contentValidation.reasonForClassification}`
                        : `The content doesn't match the subject: "${input.subject}". ${contentValidation.reasonForClassification}`,
                    language: languageDetection.detectedLanguage
                },
            };
        }

        // Find the most appropriate tag for spam content from available tags
        const { object: spamTagMatches } = await generateObject({
            model,
            schema: z.object({
                tagMatches: z.array(
                    z.object({
                        tagId: z.string(),
                        tagName: z.string(),
                        confidence: z.number().min(0).max(1),
                        reason: z.string(),
                    })
                ),
            }),
            prompt: `This email has been identified as likely spam or irrelevant content.

Subject: ${input.subject}
Email Content: ${input.emailContent}

Spam detection confidence: ${contentValidation.spamConfidence}
Reason: ${contentValidation.reasonForClassification}

Based on this information, match this spam email to the most relevant tag from the available tags below.
Provide a confidence score (0-1) and a brief reason for each match.

Respond in ${languageDetection.detectedLanguage}.

Available Tags:
${availableTags.map((tag: { id: string; name: string; color: string }) => `- ${tag.name} (ID: ${tag.id})`).join('\n')}

Return the tags most relevant to spam, junk mail, or inappropriate content with a confidence score of 0.5 or higher.
If no tags are appropriate for spam content, return an empty array.`,
        });

        // Format the tag matches
        const suggestedTags: Array<{
            id: string;
            name: string;
            confidence: number;
        }> = spamTagMatches.tagMatches
            .sort((a, b) => b.confidence - a.confidence)
            .map(match => ({
                id: match.tagId,
                name: match.tagName,
                confidence: Math.round(match.confidence * 100) / 100,
            }));

        return {
            suggestedTags,
            analysis: {
                priority: 'LOW',
                sentiment: 'neutral',
                summary: contentValidation.isSpam
                    ? `This appears to be spam content (${Math.round(contentValidation.spamConfidence * 100)}% confidence). ${contentValidation.reasonForClassification}`
                    : `The content doesn't match the subject: "${input.subject}". ${contentValidation.reasonForClassification}`,
                language: languageDetection.detectedLanguage
            },
        };
    }

    // Step 2: Analyze the email content and extract key information
    const { object: emailAnalysis } = await generateObject({
        model,
        schema: z.object({
            mainTopic: z.string(),
            keyPoints: z.array(z.string()),
            sentiment: z.enum(['positive', 'neutral', 'negative', 'urgent']),
            suggestedPriority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
            customerIntent: z.string(),
        }),
        prompt: `Analyze this email and extract key information:

Subject: ${input.subject}

Email Content:
${input.emailContent}

Extract the main topic, key points (max 3), overall sentiment, suggested priority level, and the customer's intent. 
Consider both the subject and content together, with special attention to the actual message content.

Respond in ${languageDetection.detectedLanguage}.`,
    });

    // Step 3: Fetch available tags for the inbox
    const availableTags = await prisma.tag.findMany({
        where: {
            inboxId: input.inboxId,
        },
        select: {
            id: true,
            name: true,
            color: true,
        },
    });

    if (!availableTags.length) {
        // If no tags exist, return a default response
        return {
            suggestedTags: [],
            analysis: {
                priority: emailAnalysis.suggestedPriority,
                sentiment: emailAnalysis.sentiment,
                summary: `${emailAnalysis.mainTopic}. ${emailAnalysis.keyPoints.join(' ')}`,
                language: languageDetection.detectedLanguage
            },
        };
    }

    // Step 4: Match the email content with available tags
    const { object: tagMatches } = await generateObject({
        model,
        schema: z.object({
            tagMatches: z.array(
                z.object({
                    tagId: z.string(),
                    tagName: z.string(),
                    confidence: z.number().min(0).max(1),
                    reason: z.string(),
                })
            ),
        }),
        prompt: `Based on the email analysis, match the email to the most relevant tags from the list below.
    For each tag, provide a confidence score (0-1) and a brief reason for the match.
    
    Email Subject: ${input.subject}
    
    Email Content:
    ${input.emailContent}
    
    Email Analysis:
    - Main Topic: ${emailAnalysis.mainTopic}
    - Key Points: ${emailAnalysis.keyPoints.join(', ')}
    - Sentiment: ${emailAnalysis.sentiment}
    - Customer Intent: ${emailAnalysis.customerIntent}
    
    Available Tags:
    ${availableTags.map((tag: { id: string; name: string; color: string }) => `- ${tag.name} (ID: ${tag.id})`).join('\n')}
    
    Important Note: Evaluate the actual content, not just the subject line. If the content doesn't match the subject or appears to be spam/nonsense, assign very low confidence scores.
    
    Respond in ${languageDetection.detectedLanguage}.
    
    Return only tags with a confidence score of 0.5 or higher. If no tags match well, return an empty array.`,
    });

    // Step 5: Generate a summary of the email
    const { text: summary } = await generateText({
        model,
        prompt: `Summarize this email in a single concise sentence:
    
    Subject: ${input.subject}
    
    Content: ${input.emailContent}
    
    Key Points: ${emailAnalysis.keyPoints.join(', ')}
    Main Topic: ${emailAnalysis.mainTopic}
    Customer Intent: ${emailAnalysis.customerIntent}
    
    Respond in ${languageDetection.detectedLanguage}.`,
    });

    // Format the final output
    const suggestedTags = tagMatches.tagMatches
        .sort((a, b) => b.confidence - a.confidence)
        .map(match => ({
            id: match.tagId,
            name: match.tagName,
            confidence: Math.round(match.confidence * 100) / 100,
        }));

    return {
        suggestedTags,
        analysis: {
            priority: emailAnalysis.suggestedPriority,
            sentiment: emailAnalysis.sentiment,
            summary,
            language: languageDetection.detectedLanguage
        },
    };
}