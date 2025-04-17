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
  // Create structured logger for better tracking
  const logger = {
    info: (message: string, data?: any) =>
      console.log(`[Subscription:${userId}:INFO] ${message}`, data || ""),
    error: (message: string, error?: any) =>
      console.error(`[Subscription:${userId}:ERROR] ${message}`, error || ""),
    warn: (message: string, data?: any) =>
      console.warn(`[Subscription:${userId}:WARN] ${message}`, data || ""),
  };

  logger.info("Create Subscription triggered", { userId, type });

  try {
    // Step 1: Validate inputs
    if (!userId) {
      logger.error("Invalid userId provided");
      throw new Error("Invalid userId provided");
    }

    if (!type || !SUBSCRIPTION_QUOTAS[type]) {
      logger.error("Invalid subscription type", { type });
      throw new Error(`Invalid subscription type: ${type}`);
    }

    // Step 2: Get user directly from the database first
    // In case of auth adapter issues, we can still proceed if we have a valid user ID in the database
    logger.info("Fetching user membership information");

    const currentUser = await db.select().from(user).where(eq(user.id, userId));

    if (!currentUser) {
      logger.error("User record not found in database");
      throw new Error(`User record not found for userId: ${userId}`);
    }

    logger.info("User record found", { userId: currentUser[0].id });

    // Step 3: Get organization information
    if (!currentUser) {
      logger.error("User has no organization ID");
      throw new Error("User has no associated organization");
    }

    const userOrganization = await db.query.organization.findFirst({
      where: eq(organization.id, currentUser[0].id),
    });

    if (!userOrganization) {
      logger.error("Organization not found", {
        organizationId: currentUser[0].id,
      });
      throw new Error(`Organization not found with ID: ${currentUser[0].id}`);
    }

    logger.info("Organization found", {
      organizationId: userOrganization.id,
      name: userOrganization.name,
    });

    // Step 4: Prepare subscription data
    const subscriptionPlan = SUBSCRIPTION_QUOTAS[type];
    const baseSubscriptionData = {
      plan: type,
      customerQuota: subscriptionPlan.customerQuota,
      organizationQuota: subscriptionPlan.organization.quota,
      ticketQuota: subscriptionPlan.ticketQuota,
      status: "ACTIVE" as const,
    };

    const updateValues = {
      ...baseSubscriptionData,
      updatedAt: new Date(),
    };

    const insertValues = {
      id: uuidv4(),
      userId: userId,
      ...baseSubscriptionData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    logger.info("Prepared subscription data", { plan: type });

    // Step 5: Perform the subscription upsert in a transaction
    try {
      // Use transaction to ensure data consistency
      return await db.transaction(async (tx) => {
        // Insert or update the subscription
        logger.info("Upserting subscription");
        const result = await tx
          .insert(subscription)
          .values(insertValues)
          .onConflictDoUpdate({
            target: subscription.userId,
            set: updateValues,
          })
          .returning();

        if (!result || result.length === 0) {
          logger.error("Subscription upsert failed - no result returned");
          throw new Error("Subscription upsert failed - no result returned");
        }

        const newSubscription = result[0] as Subscription;
        logger.info("Subscription upserted successfully", {
          subscriptionId: newSubscription.id,
        });

        // Step 6: Handle locked tickets
        logger.info("Checking for locked tickets");
        const lockedTickets = await tx
          .select()
          .from(ticket)
          .where(
            and(
              eq(ticket.organizationId, userOrganization.id!),
              eq(ticket.isOverQuota, true)
            )
          );

        const lockedCount = lockedTickets.length;
        logger.info("Found locked tickets", { count: lockedCount });

        // Unlock tickets based on new subscription
        if (lockedCount > 0) {
          logger.info("Unlocking tickets", { count: lockedCount });
          await tx
            .update(ticket)
            .set({ isOverQuota: false })
            .where(
              and(
                eq(ticket.organizationId, userOrganization.id!),
                eq(ticket.isOverQuota, true)
              )
            );
        }

        // Check if quota is exceeded even after subscription change
        if (lockedCount >= newSubscription.ticketQuota) {
          logger.warn("Ticket quota exceeded after subscription change", {
            lockedCount,
            quota: newSubscription.ticketQuota,
          });

          await tx.insert(log).values({
            id: uuidv4(),
            title: "Ticket Quota Exceeded",
            description: `User ${userId} has exceeded their ticket quota after subscription change.`,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        } else if (lockedCount > 0) {
          // Decrement quota by the number of unlocked tickets
          logger.info("Decrementing quota for unlocked tickets", {
            count: lockedCount,
          });
          await tx
            .update(subscription)
            .set({
              customerQuota: sql`${subscription.customerQuota} - ${lockedCount}`,
            })
            .where(eq(subscription.id, newSubscription.id));
        }

        logger.info("Subscription process completed successfully");
        return newSubscription;
      });
    } catch (error) {
      logger.error("Transaction failed during subscription process", error);
      throw error; // Re-throw to be caught by outer try-catch
    }
  } catch (err) {
    logger.error("Subscription creation failed", err);

    // Log to database for persistent error tracking
    try {
      await db.insert(log).values({
        id: uuidv4(),
        title: "Subscription Creation Failed",
        description: `Failed to create subscription for user ${userId}: ${err instanceof Error ? err.message : String(err)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (logError) {
      logger.error("Failed to log error to database", logError);
    }

    return null;
  }
}
