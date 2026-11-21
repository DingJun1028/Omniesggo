import { cn } from "@/lib/utils";

export function GlassCard({
  className,
  variant = "base",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: "base" | "liquid" }) {
  return (
    <div
      className={cn(
        "rounded-[8px] transition-all duration-150", 
        variant === "base"
          ? "bg-[var(--color-bg-base)] border-0 shadow-flat"
          : "liquid-glass shadow-none",
        className,
      )}
      {...props}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}
