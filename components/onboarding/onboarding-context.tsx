"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface OnboardingData {
  // User step
  firstName: string
  lastName: string
  companyName: string
  companyIndustry: string
  companySize: string
  communicationType: string

  // Email step
  isUsingSmtp: boolean
  smtpHost: string
  smtpPort: string
  smtpUsername: string
  smtpPassword: string
  smtpSecure: boolean
  fromEmail: string
  fromName: string

  // Organization step
  organizationName: string
  organizationLogo: File | null
  organizationLogoUrl: string | null;
  invitations: { email: string; role: string }[]
}

interface OnboardingContextType {
  data: OnboardingData
  updateData: (newData: Partial<OnboardingData>) => void
  addInvitation: (email: string, role: string) => void
  removeInvitation: (index: number) => void
}

const defaultData: OnboardingData = {
  firstName: "",
  lastName: "",
  companyName: "",
  companyIndustry: "",
  companySize: "",
  communicationType: "",

  isUsingSmtp: false,
  smtpHost: "",
  smtpPort: "",
  smtpUsername: "",
  smtpPassword: "",
  smtpSecure: true,
  fromEmail: "",
  fromName: "",

  organizationName: "",
  organizationLogo: null,
  organizationLogoUrl: null,
  invitations: [],
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>(defaultData)

  const updateData = (newData: Partial<OnboardingData>) => {
    setData(prevData => ({
      ...prevData,
      ...newData
    }));
  };
  const addInvitation = (email: string, role: string) => {
    setData((prevData) => ({
      ...prevData,
      invitations: [...prevData.invitations, { email, role }],
    }))
  }

  const removeInvitation = (index: number) => {
    setData((prevData) => ({
      ...prevData,
      invitations: prevData.invitations.filter((_, i) => i !== index),
    }))
  }

  return (
    <OnboardingContext.Provider value={{ data, updateData, addInvitation, removeInvitation }}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider")
  }
  return context
}
