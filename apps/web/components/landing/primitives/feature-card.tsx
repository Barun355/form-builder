import { cn } from "~/lib/utils";

type Size = "hero" | "medium" | "wide";
type IconTone = "filled" | "ghost";

export function FeatureCard({
  size = "medium",
  icon,
  iconTone = "filled",
  title,
  description,
  visual,
  tinted,
  className,
}: {
  size?: Size;
  icon?: React.ReactNode;
  /** "filled" = primary-tinted tile (the brand anchor). "ghost" = icon only,
       no tile — use for supporting cells to avoid repetitive icon tiles. */
  iconTone?: IconTone;
  title: string;
  description: string;
  visual?: React.ReactNode;
  tinted?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border transition-all duration-200 ease-out",
        "hover:shadow-md hover:-translate-y-0.5",
        tinted ? "bg-primary/4" : "bg-card",
        size === "hero" ? "p-8 sm:p-10" : "p-6",
        className,
      )}
    >
      <div className="flex flex-col h-full gap-5">
        {/* Header — fixed-ish height so the visual zone is predictable */}
        <div className="flex-none">
          {icon && (
            <div
              className={cn(
                "flex items-center justify-center mb-4",
                iconTone === "filled"
                  ? "h-10 w-10 rounded-lg bg-primary/10 text-primary"
                  : "h-10 w-10 text-muted-foreground -ml-1",
              )}
            >
              {icon}
            </div>
          )}
          <h3
            className={cn(
              "text-foreground",
              size === "hero" ? "text-h2" : "text-h3",
            )}
          >
            {title}
          </h3>
          <p className="mt-2 text-body text-muted-foreground max-w-md">
            {description}
          </p>
        </div>

        {/* Visual zone.
            - Hero (2x2 spanning, ~860px tall on md+): visual STRETCHES to
              fill the slot via `[&>*]:h-full`. Otherwise the fixed-height
              canvas would float at the bottom with empty space above.
            - Other cells: visual is bottom-anchored at its intrinsic
              height — `overflow-hidden` clips any overflow at the top edge.
            Note: no mask gradient. With bottom-anchored content, a bottom
            fade would erase exactly the content we want visible. */}
        {visual && (size === "hero" ? (
          <div
            className={cn(
              "relative flex-1 min-h-0 -mx-6 -mb-6 sm:-mx-10 sm:-mb-10",
              "flex *:h-full *:w-full",
            )}
          >
            {visual}
          </div>
        ) : (
          <div className="relative flex-1 min-h-0 -mx-6 -mb-6 overflow-hidden">
            <div className="absolute inset-x-6 bottom-0">{visual}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
