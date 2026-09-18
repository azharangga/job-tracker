"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function TruncateWithTooltip({ text, className = "" }: { text: string | null | undefined; className?: string }) {
  if (!text) return <span className={`text-ink-faint ${className}`}>-</span>;
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-block truncate max-w-full align-bottom cursor-default ${className}`}>{text}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[320px] break-words">{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
