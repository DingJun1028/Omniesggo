// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
// src/lib/omni-component/ui/utils.ts
/**
 * UI Utility Functions for OmniComponent
 * Provides common UI helper functions for consistent styling and behavior
 */

/**
 * Class names utility - combines multiple class names
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Variant classes mapping
 * Returns appropriate classes based on variant type
 */
export const variantClasses = {
  primary: 'bg-primary text-primaryForeground',
  secondary: 'bg-secondary text-secondaryForeground',
  destructive: 'bg-destructive text-destructiveForeground',
  outline: 'border border-input',
  ghost: 'hover:bg-accent',
  link: 'text-primary underline-offset-4',
} as const;

/**
 * Size classes mapping
 * Returns appropriate classes based on size
 */
export const sizeClasses = {
  xs: 'h-9 rounded px-2 text-xs',
  sm: 'h-10 rounded px-3 text-sm',
  md: 'h-11 rounded px-4 text-sm',
  lg: 'h-12 rounded px-6 text-sm',
  icon: 'h-10 w-10',
} as const;

/**
 * Type guard for variant
 */
export function isVariant(value: string): value is keyof typeof variantClasses {
  return Object.keys(variantClasses).includes(value);
}

/**
 * Type guard for size
 */
export function isSize(value: string): value is keyof typeof sizeClasses {
  return Object.keys(sizeClasses).includes(value);
}

/**
 * Responsive utility - creates responsive class string
 */
export function responsive(base: string, sm?: string, md?: string, lg?: string, xl?: string): string {
  const classes = [base];
  if (sm) classes.push(`sm:${sm}`);
  if (md) classes.push(`md:${md}`);
  if (lg) classes.push(`lg:${lg}`);
  if (xl) classes.push(`xl:${xl}`);
  return classes.filter(Boolean).join(' ');
}

/**
 * Utility to create CSS variable string
 */
export function cssVar(variable: string, fallback?: string): string {
  return `var(--${variable}${fallback ? `, ${fallback}` : ''})`;
}

/**
 * Utility to create transition string
 */
export function transition(
  property: string = 'all',
  duration: string = '150ms',
  timingFunction: string = 'ease-in-out'
): string {
  return `${property} ${duration} ${timingFunction}`;
}