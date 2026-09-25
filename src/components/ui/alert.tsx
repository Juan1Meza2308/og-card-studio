import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive";
}

export function Alert({ className, variant = "default", children, ...props }: AlertProps) {
  return (
    <div
      className={cn(
        "relative w-full rounded-lg border p-4",
        variant === "default" && "bg-muted text-foreground",
        variant === "destructive" && "border-destructive/50 bg-destructive/10 text-destructive",
      )}
      role="alert"
      {...props}
    >
      {children}
    </div>
  );
}

export function AlertDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm", className)} {...props}>
      {children}
    </p>
  );
}