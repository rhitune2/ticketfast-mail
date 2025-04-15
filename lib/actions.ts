import { db } from "@/db";
import { eq } from "drizzle-orm";
import { inbox, subscription, user, member, organization } from "@/db-schema";
import { auth } from "./auth";
import { headers } from "next/headers";
import type { Inbox, Organization, Subscription, User } from "@/db";
import { SUBSCRIPTION_QUOTAS } from "@/lib/constants";
import { v4 as uuidv4 } from "uuid";
import slugify from "slugify";

export async function getActiveOrganization(
  userId: string
): Promise<Organization | null> {
  if (!userId) return null;

  try {
    // Get the user's active organization directly from the API
    // Using getFullOrganization which is the correct method based on the error message
    const currentMember = await db.query.member.findFirst({
      where: eq(member.userId, userId),
    })

    if(!currentMember){
      return null;
    }

    const response = await db.query.organization.findFirst({
      where: eq(organization.id, currentMember.organizationId),
    })

    // Check if we got a valid response with organization data
    if (!response || !response.id) {
      console.log("No active organization found for user");
      return null;
    }

    // Map the API response to our Organization type
    const activeOrganization: Organization = {
      id: response.id,
      name: response.name,
      slug: response.slug || "",
      logo: response.logo || null,
      metadata: response.metadata || null,
      createdAt: response.createdAt,
    };

    return activeOrganization;
  } catch (error) {
    console.error("Error getting organization:", error);
    return null;
  }
}

export async function getUserInfo(userId: string): Promise<User | null> {
  if (!userId) return null;

  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  if (!currentUser) return null;

  return currentUser;
}

export async function createFreeSubscription(
  userId: string
): Promise<Subscription | null> {
  if (!userId) return null;

  const currentUser = await db.query.user.findFirst({
    where: eq(user?.id, userId),
  });

  if (!currentUser) return null;

  const insertSubscription = await db
    .insert(subscription)
    .values({
      id: uuidv4(),
      userId,
      plan: "FREE",
      customerQuota: SUBSCRIPTION_QUOTAS.FREE.customerQuota,
      organizationQuota: SUBSCRIPTION_QUOTAS.FREE.organization.quota,
      ticketQuota: SUBSCRIPTION_QUOTAS.FREE.ticketQuota,
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return insertSubscription[0];
}

export async function createDefaultInbox(
  userId: string
): Promise<Inbox | null> {
  if (!userId) return null;

  const currentUser = await db.query.user.findFirst({
    where: eq(user?.id, userId),
  });

  if (!currentUser) return null;

  const userOrganization = await auth.api.getFullOrganization({
    headers: await headers(),
  });

  if (!userOrganization || !userOrganization.id) {
    console.error("No organization found for user");
    return null;
  }

  // Generate random 8 character string for email address
  const randomString = Math.random().toString(36).substring(2, 10);
  const orgName = userOrganization.name || "Default";
  const orgSlug = slugify(orgName).toLowerCase();
  
  const inboxName = `${orgName} Inbox`;
  const inboxSlug = `${orgSlug}-inbox`;
  const emailAddress = `${orgSlug}-${randomString}@ticketfa.st`;

  try {
    const insertedInbox = await db.insert(inbox).values({
      id: uuidv4(),
      name: inboxName,
      slug: inboxSlug,
      emailAddress: emailAddress,
      userId: userId,
      organizationId: userOrganization.id,
      createdAt: new Date(),
    }).returning();

    console.log("Created default inbox:", insertedInbox[0]);
    return insertedInbox[0];
  } catch (error) {
    console.error("Error creating default inbox:", error);
    return null;
  }
}


export async function getOrganizationCount(userId: string): Promise<number> {
  if (!userId) return 0;

  const organizations = await db.query.member.findMany({
    where: eq(member.userId, userId),
    columns: { organizationId: true },
  });
  
  const uniqueOrgIds = new Set(organizations.map((org) => org.organizationId));

  return uniqueOrgIds.size;
}