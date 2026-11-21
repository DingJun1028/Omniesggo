"use client";

import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GuideStepper, GuideStep } from "@/components/ui/guide-stepper";
import { cn } from "@/lib/utils";

interface ViewHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: LucideIcon;
  tag?: string;
  accent?: string;
  aiProxyMode?: boolean;
  rightElement?: React.ReactNode;
  guideSteps?: { title: string; steps: GuideStep[] };
}

export function ViewHeader({
  title,
  subtitle,
  description,
  icon: Icon,
  tag,
  accent = "from-[#00FFFF]/20 to-transparent",
  aiProxyMode,
  rightElement,
  guideSteps,
}: ViewHeaderProps) {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden group">
        {/* Removed decorative glow for Ultimate Minimalist consistency */}

        
        <div className="relative bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] p-6 md:p-8 rounded-[4px] border border-[var(--glass-border)] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-flat overflow-hidden">
          {/* Solid Left Accent Bar */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-primary)]" />

          <div className="flex items-center gap-6">
            {Icon && (
              <div className="p-4 rounded-[2px] bg-[var(--color-primary)] text-white shadow-flat">
                <Icon className="w-8 h-8" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-black text-[var(--color-text-main)] italic tracking-tight uppercase">
                  {title}
                </h1>
                {tag && (
                  <Badge 
                    variant="optimal" 
                    className="px-2 py-0.5"
                  >
                    {tag}
                  </Badge>
                )}
              </div>
              <div className="flex flex-col gap-1">
                {subtitle && (
                  <p className="text-[10px] font-black text-[var(--color-primary)] tracking-[0.2em] uppercase">
                    {subtitle}
                  </p>
                )}
                {description && (
                   <p className="text-[11px] font-medium text-[var(--color-text-muted)] max-w-2xl leading-relaxed italic">
                    {description}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {rightElement && (
            <div className="flex items-center gap-4">
              {rightElement}
            </div>
          )}
        </div>
      </div>

      {/* Reusable Guide Stepper */}
      {guideSteps && (
        <GuideStepper title={guideSteps.title} steps={guideSteps.steps} />
      )}
    </div>
  );
}
