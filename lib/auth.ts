import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { organization } from "better-auth/plugins/organization";
import { polar } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { sendVerification } from "@/utils/email";
import getActiveOrganization from "./actions";

const client = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  // Use 'sandbox' if you're using the Polar Sandbox environment
  // Remember that access tokens, products, etc. are completely separated between environments.
  // Access tokens obtained in Production are for instance not usable in the Sandbox environment.
  server: "production",
});

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
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
        template : "verification-template"
      });
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const organization = await getActiveOrganization(session.userId);
          return {
            data: {
              ...session,
              activeOrganizationId: organization?.id,
            },
          };
        },
      },
    },
  },
  plugins: [
    organization({
      teams: {
        enabled: true,
        maximumTeams: 5,
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
