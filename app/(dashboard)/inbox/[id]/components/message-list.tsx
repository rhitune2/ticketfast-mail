import { type TicketMessage } from "@/db";
import { MessageItem } from "./message-item";

interface MessageListProps {
  messages: TicketMessage[];
}

export function MessageList({ messages }: MessageListProps) {
  if (!messages.length) {
    return (
      <div className="flex h-40 items-center justify-center rounded-md border border-dashed p-8 text-center">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <h3 className="mt-4 text-lg font-semibold">No messages found</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            This ticket doesn't have any messages yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <MessageItem 
          key={message.id}
          message={message}
          isLatest={index === messages.length - 1}
        />
      ))}
    </div>
  );
}
