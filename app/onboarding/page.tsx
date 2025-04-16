import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { db, User } from "@/db";
import { auth } from "@/lib/auth";
import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "TicketFast - Onboarding",
  description: "TicketFast - Onboarding",
};

export default async function OnboardingPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in");
  }

  if(session.user.isCompletedOnboarding){
    redirect("/dashboard")
  }

  const activeUser = (await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.id, session?.user?.id!),
  })) as User;

  const fullOrganization = await auth.api.getFullOrganization({
    headers: await headers(),
  });

  // Extract the basic organization properties and ensure logo is not undefined
  const activeOrganization = fullOrganization ? {
    id: fullOrganization.id,
    name: fullOrganization.name,
    createdAt: fullOrganization.createdAt,
    slug: fullOrganization.slug,
    logo: fullOrganization.logo ?? null, // Convert undefined to null
    metadata: fullOrganization.metadata
  } : null;

  return (
    <OnboardingWizard user={activeUser} organization={activeOrganization} />
  );
}
