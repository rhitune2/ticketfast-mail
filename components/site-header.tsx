"use client"

import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { AiSupportButton } from "./ai-support-button"
import { CommandSearch } from "./command-search"
import { StatusIndicator } from "./status-indicator"

export function SiteHeader() {
  const pathname = usePathname()
  
  // Format the pathname for display
  const formatPathname = () => {
    if (!pathname) return "Dashboard"
    
    // Remove leading slash and split by slashes
    const parts = pathname.replace(/^\/+/, "").split("/")
    
    // Remove route group parentheses if present
    const filteredParts = parts.filter(part => !part.startsWith("(") && part !== "")
    
    // Handle empty path (root)
    if (filteredParts.length === 0) return "Dashboard"
    
    // Get the last meaningful segment and format it
    const lastSegment = filteredParts[filteredParts.length - 1]
    return lastSegment
      .replace(/-/g, " ") // Replace dashes with spaces
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
      .join(" ")
  }
  
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{formatPathname()}</h1>
        {/* <div className="ml-auto flex items-center gap-2">
          <CommandSearch />
          <StatusIndicator />
          <AiSupportButton />
        </div> */}
      </div>
    </header>
  )
}