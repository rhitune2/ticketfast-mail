import { db } from "@/db";
import { eq } from "drizzle-orm";
import { user } from "@/db-schema";
import { auth } from "./auth";
import { headers } from "next/headers";
import type { Organization } from "@/db";

export default async function getActiveOrganization(userId: string): Promise<Organization | null> {

  if (!userId) return null;

  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  if (!currentUser) return null;

  // Get organization data from auth API
  const orgData = await auth.api.getFullOrganization({
    headers: await headers(),
  });

  if(!orgData) return null;
  
  const organization: Organization = {
    id: orgData.id,
    name: orgData.name,
    slug: orgData.slug,
    logo: orgData.logo ?? null,
    metadata: orgData.metadata ?? null,
    createdAt: orgData.createdAt
  };

  return organization;
}
