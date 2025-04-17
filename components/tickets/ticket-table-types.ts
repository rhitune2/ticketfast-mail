import { Ticket } from "@/db";

export type TicketStatus = "ASSIGNED" | "UNASSIGNED" | "WAITING" | "CLOSED";
export type TicketPriority = "LOW" | "NORMAL" | "MEDIUM" | "HIGH";

export interface TicketWithDetails extends Ticket {
  assigneeName?: string;
  contactName?: string;
}

export type SortDirection = "asc" | "desc";

export interface SortConfig {
  column: string;
  direction: SortDirection;
}

export interface FilterConfig {
  status: TicketStatus | "ALL";
  priority: TicketPriority | "ALL";
  tag: string | "ALL";
  search: string;
}

export interface TicketTableProps {
  tickets: TicketWithDetails[];
  pageSize?: number;
}
