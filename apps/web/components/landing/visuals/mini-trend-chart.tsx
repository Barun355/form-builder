import { cn } from "~/lib/utils";

// Hand-drawn area chart as inline SVG. Avoids pulling Recharts (and a client
// bundle) into the landing page; the shape is deliberately stylized.

const POINTS = [22, 28, 24, 36, 32, 44, 38, 52, 48, 60, 56, 70, 66, 82];

export function MiniTrendChart({
  className,
  height = 160,
  caption = "Submissions",
}: {
  className?: string;
  height?: number;
  caption?: string;
}) {
  const width = 320;
  const padX = 8;
  const padTop = 12;
  const padBottom = 24;
  const max = Math.max(...POINTS);
  const xs = POINTS.map(
    (_, i) => padX + (i * (width - padX * 2)) / (POINTS.length - 1),
  );
  const ys = POINTS.map(
    (v) => padTop + (1 - v / max) * (height - padTop - padBottom),
  );

  const linePath = xs
    .map((x, i) => `${i === 0 ? "M" : "L"} ${x} ${ys[i]}`)
    .join(" ");
  const areaPath = `${linePath} L ${xs[xs.length - 1]} ${height - padBottom} L ${xs[0]} ${height - padBottom} Z`;

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-body-sm text-muted-foreground">{caption}</span>
        <span className="text-body-sm text-foreground font-medium tabular-nums">
          1,531
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="mini-trend-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#mini-trend-fill)" />
        <path
          d={linePath}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {xs.map((x, i) => (
          <circle
            key={i}
            cx={x}
            cy={ys[i]}
            r={i === xs.length - 1 ? 3 : 0}
            fill="var(--primary)"
          />
        ))}
      </svg>
    </div>
  );
}
