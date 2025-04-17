import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  AboveTheFold,
  ProblemSection,
  SolutionMechanism,
  BenefitsSection,
  QualificationSection,
  OfferSection,
  StorySection,
  PricingSection,
  GuaranteeSection,
  FaqSection,
  LandingHeader,
} from "@/components/landing";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <LandingHeader />
      <div className="flex-grow">
        <AboveTheFold />
        <ProblemSection />
        <SolutionMechanism />
        <BenefitsSection />
        <QualificationSection />
        {/* <OfferSection /> */}
        <StorySection />
        <PricingSection />
        <GuaranteeSection />
        <FaqSection />
      </div>
    </div>
  );
}
