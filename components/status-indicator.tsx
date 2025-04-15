"use client";

import React from "react";
import { CheckCircle2, Clock, Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function StatusIndicator() {
  const [unreadCount, setUnreadCount] = React.useState(3);

  return (
    <div className="flex items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full p-0 text-[10px]"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="max-h-80 ">
            <DropdownMenuItem
              className="flex flex-col items-start gap-1 cursor-pointer"
              onSelect={() => setUnreadCount(Math.max(0, unreadCount - 1))}
            >
              <div className="flex w-full justify-between">
                <span className="font-medium">New ticket assigned</span>
                <Clock className="h-3 w-3" />
              </div>
              <p className="text-xs text-muted-foreground">
                Ticket #12345 has been assigned to you
              </p>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex flex-col items-start gap-1 cursor-pointer"
              onSelect={() => setUnreadCount(Math.max(0, unreadCount - 1))}
            >
              <div className="flex w-full justify-between">
                <span className="font-medium">Ticket updated</span>
                <Clock className="h-3 w-3" />
              </div>
              <p className="text-xs text-muted-foreground">
                Customer replied to ticket #12340
              </p>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex flex-col items-start gap-1 cursor-pointer"
              onSelect={() => setUnreadCount(Math.max(0, unreadCount - 1))}
            >
              <div className="flex w-full justify-between">
                <span className="font-medium">Team mention</span>
                <Clock className="h-3 w-3" />
              </div>
              <p className="text-xs text-muted-foreground">
                You were mentioned in a team discussion
              </p>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex flex-col items-start gap-1 cursor-pointer"
              onSelect={() => setUnreadCount(Math.max(0, unreadCount - 1))}
            >
              <div className="flex w-full justify-between">
                <span className="font-medium">Team mention</span>
                <Clock className="h-3 w-3" />
              </div>
              <p className="text-xs text-muted-foreground">
                You were mentioned in a team discussion
              </p>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex flex-col items-start gap-1 cursor-pointer"
              onSelect={() => setUnreadCount(Math.max(0, unreadCount - 1))}
            >
              <div className="flex w-full justify-between">
                <span className="font-medium">Team mention</span>
                <Clock className="h-3 w-3" />
              </div>
              <p className="text-xs text-muted-foreground">
                You were mentioned in a team discussion
              </p>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex flex-col items-start gap-1 cursor-pointer"
              onSelect={() => setUnreadCount(Math.max(0, unreadCount - 1))}
            >
              <div className="flex w-full justify-between">
                <span className="font-medium">Team mention</span>
                <Clock className="h-3 w-3" />
              </div>
              <p className="text-xs text-muted-foreground">
                You were mentioned in a team discussion
              </p>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex flex-col items-start gap-1 cursor-pointer"
              onSelect={() => setUnreadCount(Math.max(0, unreadCount - 1))}
            >
              <div className="flex w-full justify-between">
                <span className="font-medium">Team mention</span>
                <Clock className="h-3 w-3" />
              </div>
              <p className="text-xs text-muted-foreground">
                You were mentioned in a team discussion
              </p>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex flex-col items-start gap-1 cursor-pointer"
              onSelect={() => setUnreadCount(Math.max(0, unreadCount - 1))}
            >
              <div className="flex w-full justify-between">
                <span className="font-medium">Team mention</span>
                <Clock className="h-3 w-3" />
              </div>
              <p className="text-xs text-muted-foreground">
                You were mentioned in a team discussion
              </p>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex flex-col items-start gap-1 cursor-pointer"
              onSelect={() => setUnreadCount(Math.max(0, unreadCount - 1))}
            >
              <div className="flex w-full justify-between">
                <span className="font-medium">Team mention</span>
                <Clock className="h-3 w-3" />
              </div>
              <p className="text-xs text-muted-foreground">
                You were mentioned in a team discussion
              </p>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex flex-col items-start gap-1 cursor-pointer"
              onSelect={() => setUnreadCount(Math.max(0, unreadCount - 1))}
            >
              <div className="flex w-full justify-between">
                <span className="font-medium">Team mention</span>
                <Clock className="h-3 w-3" />
              </div>
              <p className="text-xs text-muted-foreground">
                You were mentioned in a team discussion
              </p>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
