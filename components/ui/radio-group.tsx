import * as React from "react";
import { cn } from "@/lib/utils";

interface RadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

const RadioGroupContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}>({});

export function RadioGroup({
  value,
  onValueChange,
  disabled,
  className,
  children,
}: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange, disabled }}>
      <div className={cn("space-y-2", className)} role="radiogroup">
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

interface RadioGroupItemProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {}

export const RadioGroupItem = React.forwardRef<
  HTMLInputElement,
  RadioGroupItemProps
>(({ className, ...props }, ref) => {
  const {
    value: groupValue,
    onValueChange,
    disabled,
  } = React.useContext(RadioGroupContext);

  const isChecked = groupValue === props.value;

  const handleChange = () => {
    if (props.value && onValueChange) {
      onValueChange(String(props.value));
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <input
        checked={isChecked}
        className="peer sr-only"
        disabled={disabled || props.disabled}
        onChange={handleChange}
        ref={ref}
        type="radio"
        {...props}
      />
      <div
        className={cn(
          "h-4 w-4 shrink-0 rounded-full border border-primary ring-offset-background transition-colors",
          "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
          "flex items-center justify-center",
          className
        )}
      >
        {isChecked && <div className="h-2 w-2 rounded-full bg-primary" />}
      </div>
    </div>
  );
});
RadioGroupItem.displayName = "RadioGroupItem";
