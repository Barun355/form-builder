"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "phone"
  | "select"
  | "checkbox"
  | "radio"
  | "date"
  | "datetime"
  | "file";

type NumberStats = {
  count: number;
  min: number;
  max: number;
  avg: number;
  median: number;
};

type HistogramBucket = {
  bucket: number;
  rangeStart: number;
  rangeEnd: number;
  count: number;
};

type Bucket = { value: string; count: number };

type Props = {
  fieldId: string;
  fieldType: FieldType;
  label: string;
  responseCount: number;
  responseRate: number;
  distribution?: Bucket[];
  optionLabels?: Record<string, string>;
  numberStats?: NumberStats;
  histogram?: HistogramBucket[];
};

function fmt(n: number): string {
  if (Number.isInteger(n)) return n.toLocaleString();
  return n.toFixed(2);
}

function rangeLabel(start: number, end: number): string {
  return `${fmt(start)}–${fmt(end)}`;
}

const FIELD_TYPE_LABEL: Record<FieldType, string> = {
  text: "Text",
  textarea: "Long text",
  number: "Number",
  email: "Email",
  phone: "Phone",
  select: "Dropdown",
  radio: "Single choice",
  checkbox: "Multiple choice",
  date: "Date",
  datetime: "Date & time",
  file: "File",
};

export function FieldDistribution({
  fieldType,
  label,
  responseCount,
  responseRate,
  distribution,
  optionLabels,
  numberStats,
  histogram,
}: Props) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-h4 text-foreground">{label}</h3>
          <p className="text-caps uppercase text-muted-foreground mt-0.5">
            {FIELD_TYPE_LABEL[fieldType]}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-body-sm tabular-nums text-foreground font-medium">
            {responseCount.toLocaleString()} response
            {responseCount === 1 ? "" : "s"}
          </p>
          <p className="text-body-sm text-muted-foreground tabular-nums">
            {(responseRate * 100).toFixed(0)}% response rate
          </p>
        </div>
      </div>

      {(fieldType === "select" ||
        fieldType === "radio" ||
        fieldType === "checkbox") &&
      distribution &&
      distribution.length > 0 ? (
        <ChoiceDistribution
          buckets={distribution}
          optionLabels={optionLabels}
        />
      ) : null}

      {fieldType === "number" && numberStats ? (
        <NumberStatsBlock stats={numberStats} histogram={histogram} />
      ) : null}

      {(fieldType === "select" ||
        fieldType === "radio" ||
        fieldType === "checkbox") &&
      (!distribution || distribution.length === 0) &&
      responseCount === 0 ? (
        <p className="text-body-sm text-muted-foreground">No responses yet.</p>
      ) : null}
    </div>
  );
}

function ChoiceDistribution({
  buckets,
  optionLabels,
}: {
  buckets: Bucket[];
  optionLabels?: Record<string, string>;
}) {
  const total = buckets.reduce((s, b) => s + b.count, 0);

  return (
    <div className="space-y-2 mt-2">
      {buckets.map((b) => {
        const label = optionLabels?.[b.value] ?? b.value;
        const pct = total === 0 ? 0 : (b.count / total) * 100;
        return (
          <div key={b.value} className="flex items-center gap-3">
            <div className="min-w-0 flex-[2]">
              <p className="text-body-sm text-foreground truncate">{label}</p>
              <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${Math.max(2, pct)}%` }}
                />
              </div>
            </div>
            <div className="text-body-sm text-muted-foreground tabular-nums shrink-0 min-w-16 text-right">
              {b.count.toLocaleString()} ({pct.toFixed(0)}%)
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NumberStatsBlock({
  stats,
  histogram,
}: {
  stats: NumberStats;
  histogram?: HistogramBucket[];
}) {
  return (
    <div className="space-y-4 mt-2">
      <div className="grid grid-cols-4 gap-3 text-center">
        <Stat label="Min" value={fmt(stats.min)} />
        <Stat label="Max" value={fmt(stats.max)} />
        <Stat label="Avg" value={fmt(stats.avg)} />
        <Stat label="Median" value={fmt(stats.median)} />
      </div>

      {histogram && histogram.length > 0 ? (
        <div className="h-32 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={histogram}
              margin={{ top: 4, right: 8, bottom: 4, left: -16 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                vertical={false}
              />
              <XAxis
                dataKey="bucket"
                stroke="var(--color-muted-foreground)"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                stroke="var(--color-muted-foreground)"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10 }}
                width={28}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: "var(--color-muted)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0];
                  if (!p) return null;
                  const row = p.payload as HistogramBucket;
                  return (
                    <div className="rounded-lg border bg-popover px-3 py-2 shadow-md text-body-sm">
                      <p className="text-foreground font-medium">
                        {rangeLabel(row.rangeStart, row.rangeEnd)}
                      </p>
                      <p className="text-muted-foreground tabular-nums">
                        {row.count.toLocaleString()} response
                        {row.count === 1 ? "" : "s"}
                      </p>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="count"
                fill="var(--color-chart-1)"
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/40 py-2">
      <p className="text-caps uppercase text-muted-foreground">{label}</p>
      <p className="text-body font-medium text-foreground tabular-nums">
        {value}
      </p>
    </div>
  );
}
