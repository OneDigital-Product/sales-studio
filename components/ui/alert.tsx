import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertVariant = "error" | "warning" | "success" | "info";

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<AlertVariant, string> = {
  error: "border-red-200 bg-red-50 text-red-800",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
  success: "border-green-200 bg-green-50 text-green-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
};

const variantIcons: Record<AlertVariant, React.ReactNode> = {
  error: <XCircle className="h-5 w-5 flex-shrink-0 text-red-600" />,
  warning: <AlertCircle className="h-5 w-5 flex-shrink-0 text-yellow-600" />,
  success: <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />,
  info: <Info className="h-5 w-5 flex-shrink-0 text-blue-600" />,
};

const variantTitleStyles: Record<AlertVariant, string> = {
  error: "text-red-900",
  warning: "text-yellow-900",
  success: "text-green-900",
  info: "text-blue-900",
};

const variantDescriptionStyles: Record<AlertVariant, string> = {
  error: "text-red-700",
  warning: "text-yellow-700",
  success: "text-green-700",
  info: "text-blue-700",
};

export function Alert({
  variant = "info",
  title,
  children,
  className,
}: AlertProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md border p-4",
        variantStyles[variant],
        className
      )}
    >
      {variantIcons[variant]}
      <div className="flex-1">
        {title && (
          <div
            className={cn("font-medium text-sm", variantTitleStyles[variant])}
          >
            {title}
          </div>
        )}
        <div
          className={cn(
            "text-sm",
            title && "mt-1",
            variantDescriptionStyles[variant]
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
