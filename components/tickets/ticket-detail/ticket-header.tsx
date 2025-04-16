import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { type Ticket } from "@/db";

interface TicketHeaderProps {
  ticket: Ticket;
  assignee?: { id: string; name: string; email: string; image: string | null } | null;
}

export function TicketHeader({ ticket, assignee }: TicketHeaderProps) {
  const statusMap = {
    ASSIGNED: { label: "Assigned", variant: "outline" },
    UNASSIGNED: { label: "Unassigned", variant: "secondary" },
    WAITING: { label: "Waiting", variant: "default" },
    CLOSED: { label: "Closed", variant: "destructive" },
  } as const;

  const priorityMap = {
    LOW: { label: "Low", variant: "outline" },
    NORMAL: { label: "Normal", variant: "secondary" },
    MEDIUM: { label: "Medium", variant: "default" },
    HIGH: { label: "High", variant: "destructive" },
  } as const;

  const status = statusMap[ticket.status as keyof typeof statusMap] || statusMap.UNASSIGNED;
  const priority = priorityMap[ticket.priority as keyof typeof priorityMap] || priorityMap.NORMAL;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold leading-none tracking-tight">{ticket.subject}</h1>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>From: {ticket.fromName || ticket.fromEmail}</span>
              <span>•</span>
              <span>
                {format(new Date(ticket.createdAt), "MMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={status.variant as any}>{status.label}</Badge>
              <Badge variant={priority.variant as any}>{priority.label}</Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {ticket.assigneeId && assignee ? (
              <div className="flex items-center">
                <span className="text-sm text-muted-foreground mr-2">Assigned to:</span>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={assignee.image || ""} alt={assignee.name} />
                  <AvatarFallback>
                    {assignee.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="ml-2 text-sm font-medium">{assignee.name}</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">No assignee</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
