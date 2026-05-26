import { IconChartBar, IconCursorText, IconLink } from "@tabler/icons-react";

const STEPS = [
  {
    n: "01",
    title: "Build",
    body: "Drag fields onto the canvas. Reorder, configure, preview — instant.",
    Icon: IconCursorText,
  },
  {
    n: "02",
    title: "Share",
    body: "Get a public link. Embed anywhere. Mobile-first by default.",
    Icon: IconLink,
  },
  {
    n: "03",
    title: "Analyze",
    body: "Per-field distributions, funnels, and UTM cohorts — built in.",
    Icon: IconChartBar,
  },
];

export function HowItWorks() {
  return (
    <section className="bg-muted/30 border-y border-border py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-caps uppercase text-primary text-xs tracking-wider font-semibold">
            How it works
          </p>
          <h2 className="mt-2 text-display-md text-foreground tracking-tight">
            Three steps. Zero learning curve.
          </h2>
        </div>

        <div className="mt-16 relative">
          {/* Dashed line below the number circles, connecting their bottoms.
              top-20 = ~80px from grid top (mt-6 padding + size-14 circle). */}
          <div
            aria-hidden
            className="hidden md:block absolute top-20 left-[16.7%] right-[16.7%] border-t-2 border-dashed border-primary/20"
          />

          <div className="relative grid gap-8 md:grid-cols-3">
            {STEPS.map(({ n, title, body, Icon }) => (
              <div
                key={n}
                className="relative bg-card border border-border rounded-2xl p-6 text-center transition-all duration-200 hover:border-primary/30 hover:-translate-y-0.5"
              >
                <div className="mx-auto size-14 rounded-full bg-primary/10 ring-4 ring-card flex items-center justify-center text-primary font-mono text-h3 font-semibold tabular-nums">
                  {n}
                </div>
                <div className="mt-5 inline-flex items-center gap-2">
                  <Icon className="size-4 text-muted-foreground" />
                  <h3 className="text-h3 text-foreground">{title}</h3>
                </div>
                <p className="mt-2 text-body text-muted-foreground max-w-xs mx-auto">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
