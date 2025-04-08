import { CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step {
  id: string
  title: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isActive = index === currentStep

        return (
          <div key={step.id} className="flex items-center">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-medium",
                isCompleted
                  ? "border-green-500 bg-green-500 text-white"
                  : isActive
                    ? " text-white"
                    : " text-slate-400",
              )}
            >
              {isCompleted ? <CheckIcon className="h-4 w-4" /> : index + 1}
            </div>
            <div className="ml-3">
              <p className={cn("text-sm font-medium", isActive ? "text-white" : "text-slate-400")}>{step.title}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
