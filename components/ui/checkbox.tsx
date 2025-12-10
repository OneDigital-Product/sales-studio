import { Check } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => (
    <div className="relative inline-flex items-center">
      <input className="peer sr-only" ref={ref} type="checkbox" {...props} />
      <div
        className={cn(
          "h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background transition-colors",
          "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
          "peer-checked:bg-primary peer-checked:text-primary-foreground",
          "flex items-center justify-center",
          className
        )}
      >
        {props.checked && <Check className="h-3 w-3" />}
      </div>
    </div>
  )
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
