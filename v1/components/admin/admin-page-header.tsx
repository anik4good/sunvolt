import { cn } from "@/lib/utils";

/**
 * Consistent page heading row for admin pages: title, optional description
 * and an actions slot (buttons) aligned to the right.
 */
export function AdminPageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      <div className="min-w-0">
        <h1 className="font-heading text-xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
