import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TicketMessage, TicketAttachment } from "@/db";

interface MessageItemProps {
  message: TicketMessage & {
    attachments?: TicketAttachment[];
  };
  isLatest?: boolean;
}

export function MessageItem({ message, isLatest = false }: MessageItemProps) {
  // Format the date
  const formattedDate = format(
    new Date(message.createdAt),
    "MMM d, yyyy 'at' h:mm a"
  );

  // Get initials for avatar fallback
  const getInitials = (name?: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card className={`mb-4 ${isLatest ? "border-primary" : ""}`}>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src="" alt={message.fromName || ""} />
            <AvatarFallback>{getInitials(message.fromName)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-medium">
                  {message.fromName || message.fromEmail || "Unknown"}
                </span>
                {message.isAgent && (
                  <Badge variant="outline">Team Member</Badge>
                )}
                {message.isInternal && (
                  <Badge variant="secondary">Internal Note</Badge>
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {formattedDate}
              </span>
            </div>
            
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: message.contentType === "text/html" 
                  ? message.content 
                  : message.content.replace(/\n/g, "<br />") 
              }}
            />
          </div>
        </div>
      </CardContent>
      
      {message.attachments && message.attachments.length > 0 && (
        <CardFooter className="border-t bg-muted/50 px-6 py-3">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Attachments</h4>
            <div className="flex flex-wrap gap-2">
              {message.attachments?.map((attachment) => (
                <div 
                  key={attachment.id}
                  className="flex items-center space-x-2 rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>{attachment.filename}</span>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(attachment.size / 1024)} KB
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
