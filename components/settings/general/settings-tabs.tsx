"use client";

import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState, useEffect, useRef } from "react";
import { User, Settings, CreditCard, Users } from "lucide-react";
import { Subscription, User as UserType } from "@/db";

import { ProfileTab, AccountTab, BillingTab, TeamTab } from "./tabs";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Session , Organization } from "@/lib/auth"

const tabs = [
  { name: "Profile", icon: User, component: ProfileTab },
  { name: "Account", icon: Settings, component: AccountTab },
  { name: "Billing", icon: CreditCard, component: BillingTab },
  { name: "Team", icon: Users, component: TeamTab },
];

interface SettingsTabsProps {
  session: Session;
  organization: Organization;
  subscription: Subscription | null;
  isOwner: boolean;
}


export function SettingsTabs({
  session,
  organization,
  subscription,
  isOwner,
}: SettingsTabsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverStyle, setHoverStyle] = useState({});
  const [activeStyle, setActiveStyle] = useState({ left: "0px", width: "0px" });
  const tabRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [userName, setUserName] = useState(session.user.name);
  const [organizationName, setOrganizationName] = useState(organization.name);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (hoveredIndex !== null) {
      const hoveredElement = tabRefs.current[hoveredIndex];
      if (hoveredElement) {
        const { offsetLeft, offsetWidth } = hoveredElement;
        setHoverStyle({
          left: `${offsetLeft}px`,
          width: `${offsetWidth}px`,
        });
      }
    }
  }, [hoveredIndex]);

  useEffect(() => {
    const activeElement = tabRefs.current[activeIndex];
    if (activeElement) {
      const { offsetLeft, offsetWidth } = activeElement;
      setActiveStyle({
        left: `${offsetLeft}px`,
        width: `${offsetWidth}px`,
      });
    }
  }, [activeIndex]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const initialActiveElement = tabRefs.current[0];
      if (initialActiveElement) {
        const { offsetLeft, offsetWidth } = initialActiveElement;
        setActiveStyle({
          left: `${offsetLeft}px`,
          width: `${offsetWidth}px`,
        });
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleAccountSave = async () => {
    setIsLoading(true);
    try {
      await authClient.updateUser({
        name: userName,
      });

      router.refresh();

      toast.success("Account changes saved successfully", {
        description: "Your account settings have been updated.",
      });
    } catch (error) {
      toast.error("Failed to save account changes", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to save account changes",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeamSave = () => {
    console.log("Saving team changes:", { organizationName });
  };

  return (
    <>
      <div className="bg-secondary rounded-md p-2 border mb-6">
        <div className="relative">
          <div
            className="absolute h-[30px] transition-all duration-300 ease-out bg-[#0e0f1114] dark:bg-[#ffffff1a] rounded-[6px] flex items-center"
            style={{
              ...hoverStyle,
              opacity: hoveredIndex !== null ? 1 : 0,
            }}
          />
          <div
            className="absolute bottom-[-8px] h-[2px] bg-primary dark:bg-primary transition-all duration-300 ease-out"
            style={activeStyle}
          />
          <div className="relative flex space-x-[6px] items-center">
            {tabs.map((tab, index) => (
              <div
                key={index}
                ref={(el: HTMLDivElement | null) => {
                  tabRefs.current[index] = el;
                }}
                className={`px-3 py-2 cursor-pointer transition-colors duration-300 h-[30px] flex items-center space-x-2 rounded-md ${
                  activeIndex === index
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-primary/80"
                }`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setActiveIndex(index)}
              >
                <tab.icon className="h-4 w-4" />
                <span className="text-sm leading-5 whitespace-nowrap">
                  {tab.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        {activeIndex === 0 && <ProfileTab session={session} />}
        {activeIndex === 1 && (
          <AccountTab
            session={session}
            userName={userName}
            setUserName={setUserName}
            handleAccountSave={handleAccountSave}
            isLoading={isLoading}
          />
        )}
        {activeIndex === 2 && <BillingTab subscription={subscription} />}
        {activeIndex === 3 && (
          <TeamTab
            organization={organization}
            isOwner={isOwner}
            organizationName={organizationName}
            setOrganizationName={setOrganizationName}
            handleTeamSave={handleTeamSave}
          />
        )}
      </div>
    </>
  );
}
