import { db } from "@/db";
import { and, eq, sql } from "drizzle-orm";
import {
  inbox,
  user,
  member,
  organization,
  subscription,
  ticket,
  log,
  invitation,
} from "@/db-schema";
import { auth } from "./auth";
import { headers } from "next/headers";
import type { Inbox, Organization, Subscription, User } from "@/db";
import { SUBSCRIPTION_QUOTAS } from "@/lib/constants";
import { v4 as uuidv4 } from "uuid";
import slugify from "slugify";
import { Polar } from "@polar-sh/sdk";

/**
 * Retrieves the active organization for the given user ID.
 *
 * @param userId - The ID of the user whose active organization is to be fetched.
 * @returns A Promise that resolves to the active Organization object if found, or null if no active organization is associated with the user.
 *
 * This function accesses the database to find the user's membership and then queries for the organization details.
 * Handles errors and logs them to the console.
 */
export async function getActiveOrganization(
  userId: string
): Promise<Organization | null> {
  if (!userId) return null;

  try {
    // Get the user's active organization directly from the API
    // Using getFullOrganization which is the correct method based on the error message
    const currentMember = await db.query.member.findFirst({
      where: eq(member.userId, userId),
    });

    if (!currentMember) {
      return null;
    }

    const response = await db.query.organization.findFirst({
      where: eq(organization.id, currentMember.organizationId),
    });

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

  const isInvited = await db.query.invitation.findFirst({
    where: eq(invitation.email, currentUser.email),
  });

  if (isInvited) return null;

  // check for is invited

  const insertSubscription = await db
    .insert(subscription)
    .values({
      id: uuidv4(),
      userId,
      plan: "free",
      customerQuota: SUBSCRIPTION_QUOTAS.free.customerQuota,
      organizationQuota: SUBSCRIPTION_QUOTAS.free.organization.quota,
      ticketQuota: SUBSCRIPTION_QUOTAS.free.ticketQuota,
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

  // check if inbox exists

  const inboxExists = await db.query.inbox.findFirst({
    where: eq(inbox.organizationId, userOrganization.id),
  });

  if (inboxExists) return null;

  // Generate random 8 character string for email address
  const randomString = Math.random().toString(36).substring(2, 10);
  const orgName = userOrganization.name || "Default";
  const orgSlug = slugify(orgName).toLowerCase();

  const inboxName = `${orgName} Inbox`;
  const inboxSlug = `${orgSlug}-inbox`;
  const emailAddress = `${orgSlug}-${randomString}@ticketfa.st`;

  try {
    const insertedInbox = await db
      .insert(inbox)
      .values({
        id: uuidv4(),
        name: inboxName,
        slug: inboxSlug,
        emailAddress: emailAddress,
        userId: userId,
        organizationId: userOrganization.id,
        createdAt: new Date(),
      })
      .returning();

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

export async function getOrganizationSubscription({
  headers,
}: {
  headers: Headers;
}): Promise<Subscription | null> {
  const user = await auth.api.getSession({ headers });

  if (!user) return null;

  const userOrganization = await auth.api.getFullOrganization({
    headers,
  });

  const owner = userOrganization?.members.find(
    (member) => member.role === "owner"
  );

  const currentSubscription = await db.query.subscription.findFirst({
    where: eq(subscription.userId, owner?.userId!),
  });

  return currentSubscription as Subscription | null;
}

export async function createSubscription(
  userId: string,
  type: "free" | "pro" | "enterprise"
): Promise<Subscription | null> {
  console.log({ userId, type });
  console.log("Attempting to get current user.");
  
  // 1. Get user
  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });
  console.log("Got current user query");

  if (!currentUser) {
    console.log("User not found");
    return null;
  }

  // 2. Get user's organization membership
  const userMembership = await db.query.member.findFirst({
    where: eq(member.userId, userId),
  });

  if (!userMembership) {
    console.log("User has no organization membership");
    return null;
  }

  // 3. Get organization details to find the owner
  const organizationDetails = await db.query.organization.findFirst({
    where: eq(organization.id, userMembership.organizationId),
  });

  if (!organizationDetails) {
    console.log("Organization not found");
    return null;
  }

  // Find the organization owner (assuming owner has a specific role)
  const organizationOwner = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, organizationDetails.id),
      eq(member.role, "owner")
    ),
  });

  if (!organizationOwner) {
    console.log("Organization owner not found");
    return null;
  }

  // 4. Get subscription by organization owner id
  const currentSubscription = await db.query.subscription.findFirst({
    where: eq(subscription.userId, organizationOwner.userId),
  });

  // 5. Create or update subscription
  const now = new Date();
  const subscriptionData = {
    plan: type,
    ticketQuota: SUBSCRIPTION_QUOTAS[type].ticketQuota,
    customerQuota: SUBSCRIPTION_QUOTAS[type].customerQuota,
    organizationQuota: SUBSCRIPTION_QUOTAS[type].organization.quota,
    status: "ACTIVE",
    updatedAt: now,
    createdAt: now, // Update createdAt as requested
  };

  let result;

  if (currentSubscription) {
    // Update existing subscription
    console.log("Updating existing subscription");
    result = await db
      .update(subscription)
      .set(subscriptionData)
      .where(eq(subscription.id, currentSubscription.id))
      .returning();
  } else {
    // Create new subscription
    console.log("Creating new subscription");
    result = await db
      .insert(subscription)
      .values({
        id: uuidv4(),
        userId: organizationOwner.userId,
        ...subscriptionData,
      })
      .returning();
  }

  console.log("Subscription operation completed", result[0]);
  return result[0];
}
