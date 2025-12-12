import { Check } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

interface CheckboxProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "onChange"
  > {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked);
    };

    return (
      <div className="relative inline-flex h-4 w-4 items-center justify-center">
        <input
          className="peer absolute inset-0 h-4 w-4 cursor-pointer opacity-0"
          onChange={handleChange}
          ref={ref}
          type="checkbox"
          {...props}
        />
        <div
          className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary ring-offset-background transition-colors",
            "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
            "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
            "peer-checked:bg-primary peer-checked:text-primary-foreground",
            className
          )}
        >
          {props.checked && <Check className="h-3 w-3" />}
        </div>
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
