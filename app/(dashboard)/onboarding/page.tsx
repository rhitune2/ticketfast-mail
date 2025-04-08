import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { db, User } from "@/db";
import { auth } from "@/lib/auth";
import { Metadata } from "next";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "TicketFast - Onboarding",
  description: "TicketFast - Onboarding",
};

export default async function OnboardingPage() {

  const session = await auth.api.getSession({ headers: await headers() });

  if(!session){
    redirect("/sign-in")
  }

  const activeUser = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.id, session?.user?.id!)
  }) as User;


  return <OnboardingWizard user={activeUser} />;
}
