import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "optimal",
  styleType = "solid",
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "lethal" | "critical" | "optimal";
  styleType?: "solid" | "soft";
}) {
  const baseStyles = "px-1.5 py-0.5 rounded-[2px] text-[9px] font-black tracking-widest uppercase border transition-colors";
  
  const variantStyles = {
    lethal: styleType === "solid" 
      ? "bg-[var(--color-status-lethal)] text-white border-transparent" 
      : "bg-[color-mix(in_srgb,var(--color-status-lethal)_15%,transparent)] text-[var(--color-status-lethal)] border-[var(--color-status-lethal)]/10",
    critical: styleType === "solid"
      ? "bg-[var(--color-status-critical)] text-white border-transparent"
      : "bg-[color-mix(in_srgb,var(--color-status-critical)_15%,transparent)] text-[var(--color-status-critical)] border-[var(--color-status-critical)]/10",
    optimal: styleType === "solid"
      ? "bg-[var(--color-status-optimal)] text-white border-transparent"
      : "bg-[color-mix(in_srgb,var(--color-status-optimal)_15%,transparent)] text-[var(--color-status-optimal)] border-[var(--color-status-optimal)]/10",
  };


  return (
    <span
      className={cn(
        baseStyles,
        variantStyles[variant as keyof typeof variantStyles] || variantStyles.optimal,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
