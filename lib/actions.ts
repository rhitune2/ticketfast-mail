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
  payload: any,
  type: "free" | "pro" | "enterprise"
): Promise<Subscription | null> {

  // const client = new Polar({
  //   accessToken:
  //     process.env.NODE_ENV === "development"
  //       ? process.env.POLAR_ACCESS_TOKEN_SANDBOX
  //       : process.env.POLAR_ACCESS_TOKEN,
  //   server: process.env.NODE_ENV === "development" ? "sandbox" : "production",
  // });

  const client = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN_SANDBOX!,
    server: "sandbox",
  })

  const customer = await client.customers.get({
    id: payload.customer.id,
  });

  console.log({ customer })

  const currentUser = await db.query.user.findFirst({
    where: eq(user.email, customer.email),
  });

  console.log({ currentUser })

  if (!currentUser) {
    return null;
  }

  const userOrganization = await db.query.member.findFirst({
    where: eq(member.userId, currentUser.id),
  });

  console.log({ userOrganization })

  // We need to ensure we have a valid userId
  if (!userOrganization || !userOrganization.userId) {
    console.error(
      `No organization membership found for user: ${currentUser.email}`
    );
    return null;
  }

  // userId is now guaranteed to be defined
  const userId = userOrganization.userId;

  const baseSubscriptionData = {
    plan: type,
    customerQuota: SUBSCRIPTION_QUOTAS[type].customerQuota,
    organizationQuota: SUBSCRIPTION_QUOTAS[type].organization.quota,
    ticketQuota: SUBSCRIPTION_QUOTAS[type].ticketQuota,
    status: "ACTIVE",
  };

  const updateValues = {
    ...baseSubscriptionData,
    updatedAt: new Date(),
  };

  const insertValues = {
    id: uuidv4(),
    userId: userId,
    ...baseSubscriptionData,
    createdAt: new Date(), // becasuse we creating a new subscription
    updatedAt: new Date(),
  };

  console.log({ insertValues })

  try {
    const result = await db
      .insert(subscription)
      .values(insertValues)
      .onConflictDoUpdate({
        target: subscription.userId,
        set: updateValues,
      })
      .returning();

      console.log({ result })

    try {
      const lockedTickets = await db
        .select()
        .from(ticket)
        .where(
          and(
            eq(ticket.organizationId, userOrganization.organizationId),
            eq(ticket.isOverQuota, true)
          )
        );

      if (lockedTickets && lockedTickets.length > 0) {
        await db
          .update(ticket)
          .set({ isOverQuota: false })
          .where(
            and(
              eq(ticket.organizationId, userOrganization.organizationId),
              eq(ticket.isOverQuota, true)
            )
          );
      }

      if (lockedTickets.length >= result[0].ticketQuota) {
        await db
          .insert(log)
          .values({
            id: uuidv4(),
            title: "Ticket Quota Exceeded",
            description: `User ${userId} has exceeded their ticket quota.`,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
      } else {
        const [decrement] = await db
          .update(subscription)
          .set({
            customerQuota: sql`${subscription.customerQuota} - ${lockedTickets.length}`,
          })
          .where(eq(subscription.id, result[0].id));
      }
    } catch (error) {
      console.error("Error decrementing customer quota:", error);
      return null;
    }

    if (result && result.length > 0) {
      console.error("Subscription upsert for user", userId, "returned no data.")
      return result[0] as Subscription;
    } else {
      console.error(`Subscription upsert for user ${userId} returned no data.`);
      return null;
    }
  } catch (error) {
    console.error(`Error upserting subscription for user ${userId}:`, error);
    return null;
  }
}
