import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  TicketHeader,
  MessageList,
  TicketSidebar,
  AISummary,
} from "@/components/tickets/ticket-detail";
import { getTicketById, getTicketAssignee, getTicketMessages, getAllAssignees } from "./get-ticket-data";
import { ArrowLeft } from "lucide-react";
import { TicketEditor } from "@/components/tickets/ticket-detail/editor";
import { auth } from "@/lib/auth"; // Corrected import path
import { headers } from "next/headers"; // Import headers

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const ticket = await getTicketById((await params).id);

    return {
      title: `Ticket: ${ticket?.subject || "Not Found"}`,
      description: `Ticket details for ${ticket?.subject}`,
    };
  } catch (error) {
    return {
      title: "Ticket Not Found",
      description: "The requested ticket could not be found",
    };
  }
}

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Get session
  const sessionData = await auth.api.getSession({ headers: await headers() });
  const session = sessionData?.session;

  if (!session || !session.userId) {
    // Handle missing session/user
    notFound(); // Or redirect
    return null;
  }
  const currentUserId = session.userId;

  // Get main ticket data
  const ticketData = await getTicketById(id);
  if (!ticketData) {
    notFound();
  }

  // --- Assignee Data Fetching ---
  // Fetch the SPECIFIC assignee for the TicketHeader
  const currentAssigneeData = ticketData.assigneeId
    ? await getTicketAssignee(ticketData.assigneeId)
    : null;

  // Fetch ALL assignable users for the TicketSidebar
  const organizationMembers = await getAllAssignees(); 


  // Fetch messages
  const messages = await getTicketMessages(ticketData.id);

  return (
    <div className="grid h-full flex-1 grid-cols-1 lg:grid-cols-3 xl:grid-cols-4">
      {/* Main content area */}
      <div className="col-span-1 lg:col-span-2 xl:col-span-3 border-r">
        <div className="p-6 h-full flex flex-col">
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-4 border-b mb-4">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 transition-all hover:gap-2.5"
              asChild
            >
              <a href="/inbox">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Inbox</span>
              </a>
            </Button>
          </div>

          {/* Ticket Header using SPECIFIC assignee */}
          <Suspense fallback={<TicketHeaderSkeleton />}>
            <TicketHeader ticket={ticketData} assignee={currentAssigneeData} />
          </Suspense>

          {/* AI Summary */}
          {ticketData && (
            <div className="my-4"> {/* Added margin for spacing */} 
              <Suspense fallback={<AISummarySkeleton />}>
                <AISummary ticket={ticketData} />
              </Suspense>
            </div>
          )}

          {/* Conversation Area */}
          <div className="flex-1 flex flex-col min-h-0 mt-4"> {/* Added margin top */} 
            <h2 className="text-lg font-semibold mb-2">Conversation</h2>
            <div className="flex-1 overflow-y-auto mb-4 pr-2 space-y-4">
              <Suspense fallback={<MessageListSkeleton />}>
                <MessageList messages={messages} />
              </Suspense>
            </div>
            <TicketEditor 
              ticketId={id} 
              placeholder={`Reply to ${ticketData.fromName || 'the sender'}...`} 
            />
          </div>
        </div>
      </div>

      {/* Right sidebar using ALL assignable users */}
      <div className="lg:col-span-1 hidden lg:block">
        <div className="p-6 h-full overflow-y-auto">
          <Suspense fallback={<SidebarSkeleton />}>
            <TicketSidebar
              ticket={ticketData}
              assignableUsers={organizationMembers} // Pass the correct list
              currentUserId={currentUserId} 
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

// Skeleton loaders for suspense boundaries
function TicketHeaderSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <div className="flex space-x-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    </div>
  );
}

function MessageListSkeleton() {
  return (
    <div className="space-y-6">
      {Array(3)
        .fill(0)
        .map((_, index) => (
          <div key={index} className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-3 flex-1">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="space-y-6">
      {/* Ticket Status Card Skeleton */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="p-4 border-b">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-px w-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      </div>

      {/* Customer Information Card Skeleton */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="p-4 border-b">
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      </div>

      {/* Assignee Card Skeleton */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="p-4 border-b">
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AISummarySkeleton() {
  return (
    <div className="rounded-lg border-2 border-primary/10 bg-primary/5 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-primary/10">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-start gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <div className="space-y-3 flex-1">
            <Skeleton className="h-5 w-48" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <div className="pt-2 space-y-1">
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
