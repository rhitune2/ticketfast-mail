"use server";

import { db, feedback } from "@/db";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";

type FeedbackSubmission = {
  title: string;
  description: string;
  userId: string;
};

export async function submitFeedback(data: FeedbackSubmission) {
  try {
    // Generate a unique ID for the feedback
    const feedbackId = uuidv4();
    
    // Insert feedback into the database
    await db.insert(feedback).values({
      id: feedbackId,
      title: data.title,
      description: data.description,
      userId: data.userId,
      createdAt: new Date()
    });
    
    // Revalidate the feedback page path
    revalidatePath("/feedback");
    
    return { success: true, feedbackId };
  } catch (error) {
    console.error("Error submitting feedback:", error);
    throw new Error("Failed to submit feedback");
  }
}
