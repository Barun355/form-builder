import {
  IconChartArrowsVertical,
  IconDeviceLaptop,
  IconLayoutGrid,
  IconRouteAltLeft,
  IconUsers,
} from "@tabler/icons-react";

import { FeatureCard } from "~/components/landing/primitives/feature-card";
import { MiniBuilderCanvas } from "~/components/landing/visuals/mini-builder-canvas";
import { MiniFormRenderer } from "~/components/landing/visuals/mini-form-renderer";
import { MiniSubmissionsList } from "~/components/landing/visuals/mini-submissions-list";
import { MiniFunnel } from "~/components/landing/visuals/mini-funnel";
import { MiniAudience } from "~/components/landing/visuals/mini-audience";
import { MiniTrendChart } from "~/components/landing/visuals/mini-trend-chart";

export function FeatureBento() {
  return (
    <section id="features" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-caps uppercase text-primary text-xs tracking-wider font-semibold">
            Everything you need
          </p>
          <h2 className="mt-2 text-display-md sm:text-display-lg text-foreground tracking-tight">
            From first draft to <span className="text-primary">first 1,000 responses</span>.
          </h2>
          <p className="mt-4 text-body-lg text-muted-foreground">
            Building a form shouldn&apos;t take an afternoon. Shipping it shouldn&apos;t
            need a developer. Reading the answers shouldn&apos;t need a spreadsheet.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3 md:auto-rows-[420px]">
          {/* Hero — Build */}
          <FeatureCard
            size="hero"
            className="md:col-span-2 md:row-span-2"
            icon={<IconLayoutGrid className="size-5" />}
            title="Build forms that flow"
            description="Drag fields. Drop them anywhere. Multi-page logic, conditional sections, and live preview — without leaving the canvas."
            visual={<MiniBuilderCanvas />}
          />

          {/* B — Ship */}
          <FeatureCard
            tinted
            icon={<IconDeviceLaptop className="size-5" />}
            title="Ship to any audience"
            description="A public URL by default. Embed anywhere. Mobile-first out of the box."
            visual={<MiniFormRenderer />}
          />

          {/* C — Real-time */}
          <FeatureCard
            iconTone="ghost"
            icon={<IconUsers className="size-5" />}
            title="Replies, in real time"
            description="Watch submissions land as they happen. Drill into any one to replay against the exact form version."
            visual={<MiniSubmissionsList />}
          />

          {/* D — Funnel */}
          <FeatureCard
            iconTone="ghost"
            icon={<IconRouteAltLeft className="size-5" />}
            title="Know what's working"
            description="Every form ships with funnel analytics — started, completed, drop-off."
            visual={<MiniFunnel />}
          />

          {/* E — Wide analytics */}
          <FeatureCard
            iconTone="ghost"
            className="md:col-span-2"
            icon={<IconChartArrowsVertical className="size-5" />}
            title="Built-in analytics, no dashboards to build"
            description="Per-field distributions, device and locale breakdowns, UTM cohorts — already live the moment your first submission lands."
            visual={
              <div className="grid grid-cols-2 gap-3">
                <MiniTrendChart />
                <MiniAudience />
              </div>
            }
          />
        </div>
      </div>
    </section>
  );
}
