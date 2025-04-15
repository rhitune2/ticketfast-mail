"use client"

import React from "react"
import { Sparkles, MessageSquareText, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

export function AiSupportButton() {
  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <TooltipProvider>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline"
                size="icon"
                className="relative h-8 w-8 border-muted-foreground/30"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <div className="relative">
                  <Sparkles 
                    className={`h-4 w-4 transition-colors ${isHovered ? 'text-violet-500' : 'text-muted-foreground'}`} 
                  />
                  <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-violet-500" />
                </div>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>AI Support Tools</p>
          </TooltipContent>
        </Tooltip>
        
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-xs font-medium text-muted-foreground">AI Assistance</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-muted">
            <Bot className="h-4 w-4" />
            <span>Ask AI Assistant</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-muted">
            <MessageSquareText className="h-4 w-4" />
            <span>Generate Response</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-muted">
            <Sparkles className="h-4 w-4" />
            <span>Summarize Ticket</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  )
}
