import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "solid",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "wireframe" | "gold";
}) {
  const baseStyles =
    "px-5 py-2.5 rounded-[6px] font-black transition-all duration-150 flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest select-none active:scale-95";

  const variants = {
    solid:
      "bg-gradient-to-r from-[var(--color-primary-start)] to-[var(--color-primary-end)] text-white hover:brightness-105 active:brightness-90 border-none shadow-[0_4px_12px_var(--color-primary-glow)]",
    wireframe:
      "bg-transparent border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 active:bg-[var(--color-primary)]/10",
    gold: "bg-[var(--color-accent)] text-white hover:brightness-105 active:brightness-90 border-none shadow-none",
  };

  return (
    <button className={cn(baseStyles, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}
