import { Ticket } from "@/db";
import { getAllTickets } from "@/lib/inbox/actions"
import { Metadata } from "next";
import { TicketTable, TicketWithDetails } from "@/components/tickets";
import { Suspense } from "react";
import { TicketTableSkeleton } from "@/components/tickets";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "TicketFast - Inbox",
    description: "TicketFast - Inbox - AI Intelligence Ticket Management System"
}

async function TicketTableContainer() {
    // Fetch tickets with a slight delay to demonstrate loading state
    const allTickets = await getAllTickets() as TicketWithDetails[];
    
    return <TicketTable tickets={allTickets} />;
}

export default function InboxPage() {
    return (
        <div className="container mx-auto space-y-6">
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
                <p className="text-muted-foreground">
                    View and manage all your tickets in one place
                </p>
            </div>
            
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle>Tickets</CardTitle>
                    <CardDescription>
                        View, filter, and manage your support tickets
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<TicketTableSkeleton />}>
                        <TicketTableContainer />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    );
}