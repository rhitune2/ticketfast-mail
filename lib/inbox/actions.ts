import { db } from "@/db";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { ticket } from "@/db-schema";
import type { Ticket } from "@/db/index"

export async function getAllTickets(): Promise<Ticket[]>{
    const session = await auth.api.getSession({ headers: await headers() })

    if(!session){
        return [];
    }

    if(!session.session.activeOrganizationId){
        return [];
    }

    const tickets = await db.query.ticket.findMany({
        where: eq(ticket.organizationId, session.session.activeOrganizationId)
    })

    return tickets;
}