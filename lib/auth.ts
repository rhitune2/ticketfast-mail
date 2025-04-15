import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, invitation, member, subscription, user } from "@/db";
import { organization } from "better-auth/plugins/organization";
import { polar } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { sendVerification, sendOrganizationInvitation } from "@/utils/email";
import {
  createDefaultInbox,
  createFreeSubscription,
  getActiveOrganization,
  getUserInfo,
  getOrganizationCount,
} from "@/lib/actions";
import { headers } from "next/headers";
import { SUBSCRIPTION_QUOTAS } from "@/lib/constants";
import { eq } from "drizzle-orm";
import { createAuthMiddleware } from "better-auth/api";

const client = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: "production",
});

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path.startsWith("/organization/accept-invitation")) {
        try {
          const update = await auth.api.updateUser({
            headers: await headers(),
            body: {
              isCompletedOnboarding: true,
            },
          });
        } catch (error) {
          console.error("Error processing invitation acceptance:", error);
        }
      }
    }),
  },
  user: {
    additionalFields: {
      isCompletedOnboarding: {
        type: "boolean",
        defaultValue: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url, token }, request) => {
      await sendVerification({
        to: user.email,
        subject: "Verify your email address",
        url,
        template: "verification-template",
      });
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          try {
            const user = await getUserInfo(session.userId);
            if (user?.isCompletedOnboarding) {
              const organization = await getActiveOrganization(session.userId);
              return {
                data: {
                  ...session,
                  activeOrganizationId: organization?.id,
                },
              };
            } else {
              return {
                data: session,
              };
            }
          } catch (error) {
            return {
              data: session,
            };
          }
        },
      },
    },
    user: {
      create: {
        after: async (currentUser) => {
          try {
            await createFreeSubscription(currentUser.id);
          } catch {
            throw new Error("Failed to create user");
          }
        },
      },
      update: {
        after: async (currentUser) => {

          // check if user is invited by

          const isInvited = await db.query.invitation.findFirst({
            where: eq(invitation.email, currentUser.email),
          })

          // we dont create inbox because he is invited.
          if(isInvited) return;

          const userOrganization = await auth.api.getFullOrganization({
            headers: await headers(),
          });

          await createDefaultInbox(currentUser.id);

          if (!userOrganization) {
            console.error("Failed to update user");
            throw new Error("Failed to update user");
          }
        },
      },
    },
  },
  plugins: [
    organization({
      // Return the maximum number of invitations allowed for this user
      async invitationLimit(userContext: {
        user: { id: string };
      }): Promise<number> {
        try {
          // Get the user's organization
          const organization = await getActiveOrganization(userContext.user.id);
          if (!organization) return 0; // No organization, no invitations allowed

          // Get user and subscription info
          const user = await getUserInfo(userContext.user.id);
          if (!user) {
            return 0;
          }

          const userSubscription = await db.query.subscription.findFirst({
            where: eq(subscription.userId, userContext.user.id),
          });

          switch (userSubscription?.plan) {
            case "FREE":
              return SUBSCRIPTION_QUOTAS.FREE.organization.memberQuota;
            case "PRO":
              return SUBSCRIPTION_QUOTAS.PRO.organization.memberQuota;
            case "ENTERPRISE":
              return SUBSCRIPTION_QUOTAS.ENTERPRISE.organization.memberQuota;
            default:
              return SUBSCRIPTION_QUOTAS.FREE.organization.memberQuota;
          }
        } catch (error) {
          console.error("Error checking invitation limit:", error);
          return SUBSCRIPTION_QUOTAS.FREE.organization.memberQuota;
        }
      },
      async organizationLimit(user) {
        const userSubscription = await db.query.subscription.findFirst({
          where: eq(subscription.userId, user.id),
        });

        const userOrganizationCount = await getOrganizationCount(user.id);

        let maxOrganizations = SUBSCRIPTION_QUOTAS.FREE.organization.quota;
        switch (userSubscription?.plan) {
          case "PRO":
            maxOrganizations = SUBSCRIPTION_QUOTAS.PRO.organization.quota;
            break;
          case "ENTERPRISE":
            maxOrganizations =
              SUBSCRIPTION_QUOTAS.ENTERPRISE.organization.quota;
            break;
        }

        return userOrganizationCount >= maxOrganizations;
      },
      async sendInvitationEmail(data) {
        const inviteLink = `${process.env.NODE_ENV === "development"  ? "http://localhost:3000" : "https://ticketfast-mail.vercel.app"}/accept-invitation/${data.id}`;
        await sendOrganizationInvitation({
          email: data.email,
          invitedByUsername: data.inviter.user.name,
          invitedByEmail: data.inviter.user.email,
          teamName: data.organization.name,
          inviteLink,
        });
      },
      teams: {
        enabled: false,
      },
      organizationCreation: {
        disabled: false,
      },
    }),
    polar({
      client,
      createCustomerOnSignUp: true,
      enableCustomerPortal: true,
    }),
  ],
});
