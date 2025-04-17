"use client";

import {
  CalendarIcon,
  Loader2,
  MailIcon,
  PhoneIcon,
  UserIcon,
  CheckCircle,
  UserPlus,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Ticket, Contact, Member, User } from "@/db";
import { Button } from "@/components/ui/button";
import { TAGS } from "@/lib/constants";

const ALLOWED_TICKET_STATUSES = [
  "ASSIGNED",
  "UNASSIGNED",
  "WAITING",
  "CLOSED",
] as const;
type TicketStatus = (typeof ALLOWED_TICKET_STATUSES)[number];

const ALLOWED_TICKET_PRIORITIES = ["LOW", "NORMAL", "MEDIUM", "HIGH"] as const;
type TicketPriority = (typeof ALLOWED_TICKET_PRIORITIES)[number];

const tagOptions = TAGS;

interface TicketSidebarProps {
  ticket: Ticket & { contact: Contact | null };
  // assignableUsers: (Member & { user: User })[];
  assignableUsers: any;
  currentUserId: string;
}

const statusOptions = ALLOWED_TICKET_STATUSES;
const priorityOptions = ALLOWED_TICKET_PRIORITIES;

const getInitials = (name: string | null | undefined): string => {
  if (!name) return "??";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

const formatEnumString = (str: string): string => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export function TicketSidebar({
  ticket,
  assignableUsers,
  currentUserId,
}: TicketSidebarProps) {
  const router = useRouter();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingAssignee, setIsUpdatingAssignee] = useState(false);
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isAssigningToMe, setIsAssigningToMe] = useState(false);
  const [isUpdatingTag, setIsUpdatingTag] = useState(false);

  console.log({ assignableUsers });

  const handleUpdateTicket = async (
    field: "status" | "assigneeId" | "priority" | "tag",
    value: string | null,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    setLoading(true);

    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update ticket");
      }

      toast.success(
        `Ticket ${field === "status" ? "status" : field === "assigneeId" ? "assignee" : field === "tag" ? "tag" : "priority"} updated successfully`
      );
      router.refresh();
    } catch (error: any) {
      console.error(`Error updating ticket ${field}:`, error);
      toast.error(`Failed to update ticket ${field}`, {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTicket = () => {
    if (ticket.status !== "CLOSED" && !isClosing) {
      handleUpdateTicket("status", "CLOSED", setIsClosing);
    }
  };

  const handleAssignToMe = () => {
    if (
      ticket.assigneeId !== currentUserId &&
      currentUserId &&
      !isAssigningToMe
    ) {
      handleUpdateTicket("assigneeId", currentUserId, setIsAssigningToMe);
    }
  };

  return (
    <div className="space-y-6 sticky top-5">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Ticket Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="status-select">Status</Label>
            <Select
              value={ticket.status}
              onValueChange={(value) =>
                handleUpdateTicket("status", value, setIsUpdatingStatus)
              }
              disabled={isUpdatingStatus}
              name="status-select"
            >
              <SelectTrigger className="w-full mt-1" id="status-select">
                {isUpdatingStatus ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status: TicketStatus) => (
                  <SelectItem key={status} value={status}>
                    {formatEnumString(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="assignee-select">Assignee</Label>
            <Select
              value={ticket.assigneeId ?? ""}
              onValueChange={(value) =>
                handleUpdateTicket(
                  "assigneeId",
                  value === "" ? null : value,
                  setIsUpdatingAssignee
                )
              }
              disabled={isUpdatingAssignee || isClosing || isAssigningToMe}
              name="assignee-select"
            >
              <SelectTrigger className="w-full mt-1" id="assignee-select">
                {isUpdatingAssignee ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                {assignableUsers?.map((member : any) => (
                  <SelectItem key={member.userId} value={member.userId}>
                    {member.user.name || member.user.email || "Unnamed User"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="priority-select">Priority</Label>
            <Select
              value={ticket.priority}
              onValueChange={(value) =>
                handleUpdateTicket("priority", value, setIsUpdatingPriority)
              }
              disabled={isUpdatingPriority}
              name="priority-select"
            >
              <SelectTrigger className="w-full mt-1" id="priority-select">
                {isUpdatingPriority ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((priority: TicketPriority) => (
                  <SelectItem key={priority} value={priority}>
                    {formatEnumString(priority)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="tag-select">Tag</Label>
            <Select
              value={ticket.tag || ""}
              onValueChange={(value) =>
                handleUpdateTicket("tag", value === "" ? null : value, setIsUpdatingTag)
              }
              disabled={isUpdatingTag}
              name="tag-select"
            >
              <SelectTrigger className="w-full mt-1" id="tag-select">
                {isUpdatingTag ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                <SelectValue placeholder="Select tag" />
              </SelectTrigger>
              <SelectContent>
                {tagOptions.map((tag: string) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Contact Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {getInitials(ticket.contact?.fullName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">
                {ticket.contact?.fullName || "No Name Provided"}
              </div>
              {ticket.contact?.email && (
                <div className="text-sm text-muted-foreground">
                  {ticket.contact.email}
                </div>
              )}
            </div>
          </div>

          {ticket.contact?.email && (
            <div className="flex items-center gap-2 text-sm">
              <MailIcon className="h-4 w-4 text-muted-foreground" />
              <a
                href={`mailto:${ticket.contact.email}`}
                className="hover:underline"
              >
                {ticket.contact.email}
              </a>
            </div>
          )}
          {ticket.contact?.phoneNumber && (
            <div className="flex items-center gap-2 text-sm">
              <PhoneIcon className="h-4 w-4 text-muted-foreground" />
              <span>{ticket.contact.phoneNumber}</span>
            </div>
          )}
          <Separator />
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{format(new Date(ticket.createdAt), "PPP p")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Update</span>
              <span>{format(new Date(ticket.updatedAt), "PPP p")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Fast Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col space-y-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleCloseTicket}
            disabled={
              ticket.status === "CLOSED" || isClosing || isAssigningToMe
            }
            className="justify-start"
          >
            {isClosing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Close Ticket
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAssignToMe}
            disabled={
              !currentUserId ||
              ticket.assigneeId === currentUserId ||
              isAssigningToMe ||
              isClosing
            }
            className="justify-start"
          >
            {isAssigningToMe ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            Assign to Me
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
