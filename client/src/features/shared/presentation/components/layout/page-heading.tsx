import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * @deprecated Replaced by `PageHero` (feature 017-ui-style-cleanup).
 * The hero banner now provides the title/subtitle heading on content pages.
 * Kept only for backward compatibility; prefer `PageHero` in new views.
 */
export type PageHeadingProps = {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

export function PageHeading({
  title,
  description,
  action,
  className,
}: PageHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60",
        className
      )}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
      </div>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
}

export default PageHeading;
