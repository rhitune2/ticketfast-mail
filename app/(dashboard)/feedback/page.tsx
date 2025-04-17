import { FeedbackForm } from "@/components/feedback-form";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { Metadata } from "next";

export const metadata : Metadata = {
  title : "TicketFast - Feedback",
  description: "TicketFast - Feedback Page for customers"
}

export default async function FeedbackPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.session?.userId) {
    return (
      <div className="container w-full py-10 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            Please sign in to submit feedback
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container w-full flex flex-col items-center justify-center">
      <div className="w-5xl py-10 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Your Feedback Matters
          </h1>
          <p className="text-muted-foreground">
            Help us improve TicketFast by sharing your experience and
            suggestions.
          </p>
        </div>

        <FeedbackForm userId={session.session.userId} />
      </div>
    </div>
  );
}
