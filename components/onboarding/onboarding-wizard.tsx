"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserStep } from "./steps/user-step";
import { EmailStep } from "./steps/email-step";
import { OrganizationStep } from "./steps/organization-step";
import { InviteStep } from "./steps/invite-step";
import { StepIndicator } from "./step-indicator";
import { Card, CardContent } from "../ui/card";
import { OnboardingProvider } from "./onboarding-context";
import type { User, Organization } from "@/db";

const steps = [
  { id: "user", title: "User Information" },
  { id: "email", title: "Email Configuration" },
  { id: "organization", title: "Organization Setup" },
  { id: "invitations", title: "Team Invitations" },
];

export function OnboardingWizard({ user, organization }: { user: User, organization?: Organization | null }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [animationDirection, setAnimationDirection] = useState<"next" | "prev">(
    "next"
  );

  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setAnimationDirection("next");
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setAnimationDirection("prev");
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <OnboardingProvider>
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-b from-background to-background/95 dark:from-background/50 dark:to-background">
        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-5%] w-1/3 h-1/3 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-[-15%] left-[-10%] w-2/3 h-1/3 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <Card className="w-full max-w-5xl shadow-xl border border-primary/10 rounded-2xl overflow-hidden relative z-10">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row min-h-[600px] md:min-h-[650px]">
              <div
                className="text-white p-6 md:p-8 md:w-72 flex flex-col relative overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, var(--primary) 0%, rgba(var(--primary-rgb), 0.8) 100%)",
                }}
              >
                <div className="mb-8 relative">
                  <h1 className="text-2xl font-bold mb-2">TicketFast</h1>
                  <p className="text-slate-100/80 text-sm">
                    Complete your account setup to get started
                  </p>
                </div>

                <StepIndicator steps={steps} currentStep={currentStep} />

                <div className="mt-auto pt-8 hidden md:flex items-center gap-2">
                  <div className="flex h-2 items-center space-x-1">
                    {steps.map((_, index) => (
                      <div
                        key={index}
                        className={`h-2 w-2 rounded-full transition-all duration-300 ${
                          index === currentStep ? "bg-white" : "bg-white/30"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-100/70 ml-2">
                    Step {currentStep + 1} of {steps.length}
                  </p>
                </div>
              </div>

              <div
                className="flex-1 p-6 md:p-8 flex flex-col overflow-y-auto"
                role="region"
                aria-label={`Onboarding step ${currentStep + 1}: ${
                  steps[currentStep].title
                }`}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={currentStep}
                    initial={{
                      opacity: 0,
                      x: animationDirection === "next" ? 50 : -50,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    exit={{
                      opacity: 0,
                      x: animationDirection === "next" ? -50 : 50,
                    }}
                    transition={{
                      duration: 0.4,
                      ease: [0.22, 1, 0.36, 1], // Custom ease curve for smoother animation
                    }}
                    className="h-full flex flex-col"
                  >
                    {currentStep === 0 && (
                      <UserStep onNext={goToNextStep} user={user} />
                    )}
                    {currentStep === 1 && (
                      <EmailStep
                        onNext={goToNextStep}
                        onBack={goToPreviousStep}
                        user={user}
                      />
                    )}
                    {currentStep === 2 && (
                      <OrganizationStep 
                        onBack={goToPreviousStep} 
                        onNext={goToNextStep}
                        user={user} 
                        organization={organization}
                      />
                    )}
                    {currentStep === 3 && (
                      <InviteStep 
                        onBack={goToPreviousStep} 
                        user={user} 
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </OnboardingProvider>
  );
}
