import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  strength: number;
}

export function PasswordStrengthIndicator({
  strength,
}: PasswordStrengthIndicatorProps) {
  return (
    <div className="mt-1 space-y-1">
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={cn(
            "transition-all duration-300 ease-in-out",
            strength < 30 ? "bg-red-500" : 
            strength < 60 ? "bg-yellow-500" : 
            "bg-green-500"
          )}
          style={{ width: `${strength}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {strength < 30
          ? "Weak password"
          : strength < 60
          ? "Medium password"
          : "Strong password"}
      </p>
    </div>
  );
}
