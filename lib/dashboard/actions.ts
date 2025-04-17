import { contact, member, ticket } from "@/db-schema";
import { and, eq, or, gte, lt, between, sql, count, desc } from "drizzle-orm";
import { auth } from "../auth";
import { headers } from "next/headers";
import { db } from "@/db";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  eachDayOfInterval,
  startOfDay,
  endOfDay,
} from "date-fns";

export interface CardsData {
  activeTickets: number;
  activeTicketsLastMonth: number;

  closedTickets: number;
  closedTicketsLastMonth: number;

  teamMembers: number;
  contacts: number;
}

export async function getDashboardCardsData(): Promise<CardsData> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || !session.session.activeOrganizationId) {
    return {
      activeTickets: 0,
      activeTicketsLastMonth: 0,
      closedTickets: 0,
      closedTicketsLastMonth: 0,
      teamMembers: 0,
      contacts: 0,
    };
  }

  // Get current date information using date-fns
  const now = new Date();

  // Calculate current month start (April 1, 2025)
  const currentMonthStart = startOfMonth(now);

  // Calculate previous month start and end (March 1, 2025 - March 31, 2025)
  const previousMonthStart = startOfMonth(subMonths(now, 1));
  const previousMonthEnd = endOfMonth(subMonths(now, 1));

  // Use Promise.all to get all required data concurrently
  const [
    currentMonthActiveTickets,
    previousMonthActiveTickets,
    currentMonthClosedTickets,
    previousMonthClosedTickets,
  ] = await Promise.all([
    // Query for current month tickets (April 1-17, 2025)
    db
      .select()
      .from(ticket)
      .where(
        and(
          eq(ticket.organizationId, session.session.activeOrganizationId),
          or(
            eq(ticket.status, "ASSIGNED"),
            eq(ticket.status, "UNASSIGNED"),
            eq(ticket.status, "WAITING")
          ),
          gte(ticket.createdAt, currentMonthStart),
          lt(ticket.createdAt, now)
        )
      ),

    // Query for previous month active tickets (March 2025)
    db
      .select()
      .from(ticket)
      .where(
        and(
          eq(ticket.organizationId, session.session.activeOrganizationId),
          or(
            eq(ticket.status, "ASSIGNED"),
            eq(ticket.status, "UNASSIGNED"),
            eq(ticket.status, "WAITING")
          ),
          between(ticket.createdAt, previousMonthStart, previousMonthEnd)
        )
      ),

    // Query for current month closed tickets (April 2025)
    db
      .select()
      .from(ticket)
      .where(
        and(
          eq(ticket.organizationId, session.session.activeOrganizationId),
          eq(ticket.status, "CLOSED"),
          gte(ticket.createdAt, currentMonthStart),
          lt(ticket.createdAt, now)
        )
      ),

    // Query for previous month closed tickets (March 2025)
    db
      .select()
      .from(ticket)
      .where(
        and(
          eq(ticket.organizationId, session.session.activeOrganizationId),
          eq(ticket.status, "CLOSED"),
          between(ticket.createdAt, previousMonthStart, previousMonthEnd)
        )
      ),
  ]);

  const teamMembersCount = await db
    .select()
    .from(member)
    .where(eq(member.organizationId, session.session.activeOrganizationId))
    .then((members) => members.filter(m => m.role !== "owner").length);

  const contactsCount = await db
    .select()
    .from(contact)
    .where(eq(contact.organizationId, session.session.activeOrganizationId))
    .then((contacts) => contacts.length);

  return {
    activeTickets: currentMonthActiveTickets.length,
    activeTicketsLastMonth: previousMonthActiveTickets.length,
    closedTickets: currentMonthClosedTickets.length,
    closedTicketsLastMonth: previousMonthClosedTickets.length,
    teamMembers: teamMembersCount,
    contacts: contactsCount,
  };
}

// Define the interface for the chart data points
export interface ChartDataPoint {
  date: string; // Format: YYYY-MM-DD
  tickets: number;
  contacts: number;
}

// Function to fetch contact data for the DataTable
export interface ContactData {
  id: string;
  fullName: string | null; // Use fullName from schema, or construct if needed
  email: string;
  createdAt: string; // Format as string for simplicity, or use Date
}

// Function to fetch data for the dashboard chart (last 3 months)
export async function getDashboardChartData(): Promise<ChartDataPoint[]> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || !session.session.activeOrganizationId) {
    return []; // Return empty array if no session or org ID
  }

  const organizationId = session.session.activeOrganizationId;

  // Calculate date range: today and 3 months ago
  const endDate = endOfDay(new Date()); // End of today
  const startDate = startOfDay(subMonths(endDate, 3)); // Start of the day 3 months ago

  // Fetch tickets and contacts created within the date range concurrently
  const [ticketsData, contactsData] = await Promise.all([
    db
      .select({
        // Group by the creation date (YYYY-MM-DD)
        date: sql<string>`DATE(${ticket.createdAt})`,
        // Count the tickets for each date
        count: count(ticket.id),
      })
      .from(ticket)
      .where(
        and(
          eq(ticket.organizationId, organizationId),
          // Filter by the date range
          between(ticket.createdAt, startDate, endDate)
        )
      )
      // Group the results by the formatted date
      .groupBy(sql`DATE(${ticket.createdAt})`)
      // Order by date (optional but good for consistency)
      .orderBy(sql`DATE(${ticket.createdAt})`),

    db
      .select({
        // Group by the creation date (YYYY-MM-DD)
        date: sql<string>`DATE(${contact.createdAt})`,
        // Count the contacts for each date
        count: count(contact.id),
      })
      .from(contact)
      .where(
        and(
          eq(contact.organizationId, organizationId),
          // Filter by the date range
          between(contact.createdAt, startDate, endDate)
        )
      )
      // Group the results by the formatted date
      .groupBy(sql`DATE(${contact.createdAt})`)
      // Order by date (optional but good for consistency)
      .orderBy(sql`DATE(${contact.createdAt})`),
  ]);

  // --- Process data to create the final ChartDataPoint array ---

  // Generate all dates within the 3-month interval
  const dateInterval = eachDayOfInterval({ start: startDate, end: endDate });

  // Create a map to store counts for each date (YYYY-MM-DD -> { tickets, contacts })
  const dailyCounts = new Map<string, { tickets: number; contacts: number }>();

  // Initialize map with all dates in the interval having 0 counts
  dateInterval.forEach((day) => {
    const formattedDate = format(day, "yyyy-MM-dd");
    dailyCounts.set(formattedDate, { tickets: 0, contacts: 0 });
  });

  // Populate ticket counts from the fetched data
  ticketsData.forEach((row) => {
    const dateStr = row.date;
    if (dailyCounts.has(dateStr)) {
      dailyCounts.get(dateStr)!.tickets = row.count;
    }
  });

  // Populate contact counts from the fetched data
  contactsData.forEach((row) => {
    const dateStr = row.date;
    if (dailyCounts.has(dateStr)) {
      dailyCounts.get(dateStr)!.contacts = row.count;
    }
  });

  // Convert the map into the final ChartDataPoint array
  const chartData: ChartDataPoint[] = Array.from(dailyCounts.entries()).map(
    ([date, counts]) => ({
      date,
      tickets: counts.tickets,
      contacts: counts.contacts,
    })
  );

  return chartData;
}

// Function to fetch contacts for the DataTable
export async function getContactsData(): Promise<ContactData[]> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || !session.session.activeOrganizationId) {
    return []; // Return empty array if no session or org ID
  }

  const organizationId = session.session.activeOrganizationId;
  try {
    const contactsResult = await db
      .select({
        id: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        fullName: contact.fullName,
        email: contact.email,
        createdAt: contact.createdAt,
      })
      .from(contact)
      .where(eq(contact.organizationId, organizationId))
      .orderBy(desc(contact.createdAt));

    // Format the data if needed (e.g., date formatting)
    return contactsResult.map((c) => ({
      id: c.id,
      fullName: c.fullName ?? ([c.firstName, c.lastName].filter(Boolean).join(' ') || null),
      email: c.email,
      createdAt: format(c.createdAt, "yyyy-MM-dd"),
    }));
  } catch (error) {
    console.error("Error fetching contacts for dashboard:", error);
    return [];
  }
}
