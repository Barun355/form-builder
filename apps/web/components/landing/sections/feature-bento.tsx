"use client";

import {
  IconChartArrowsVertical,
  IconDeviceLaptop,
  IconLayoutGrid,
  IconRouteAltLeft,
  IconUsers,
} from "@tabler/icons-react";
import { m } from "framer-motion";

import { FeatureCard } from "~/components/landing/primitives/feature-card";
import { SectionHeader } from "~/components/landing/motion/section-header";
import { MiniBuilderCanvas } from "~/components/landing/visuals/mini-builder-canvas";
import { MiniFormRenderer } from "~/components/landing/visuals/mini-form-renderer";
import { MiniSubmissionsList } from "~/components/landing/visuals/mini-submissions-list";
import { MiniFunnel } from "~/components/landing/visuals/mini-funnel";
import { MiniAudience } from "~/components/landing/visuals/mini-audience";
import { MiniTrendChart } from "~/components/landing/visuals/mini-trend-chart";

const EASE = [0.22, 1, 0.36, 1] as const;
const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export function FeatureBento() {
  return (
    <section id="features" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Everything you need"
          title={
            <>
              From first draft to{" "}
              <span className="text-primary">first 1,000 responses</span>.
            </>
          }
          subtitle="Building a form shouldn't take an afternoon. Shipping it shouldn't need a developer. Reading the answers shouldn't need a spreadsheet."
        />

        <m.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10% 0px" }}
          variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
          className="mt-12 grid gap-5 md:grid-cols-3 md:auto-rows-[420px]"
        >
          {/* Hero — Build. col-span/row-span lives on the m.div wrapper so
              the parent grid still resolves correctly while the wrapper is
              what gets staggered. */}
          <m.div variants={cardVariants} className="md:col-span-2 md:row-span-2">
            <FeatureCard
              size="hero"
              className="h-full"
              icon={<IconLayoutGrid className="size-5" />}
              title="Build forms that flow"
              description="Drag fields. Drop them anywhere. Multi-page logic, conditional sections, and live preview — without leaving the canvas."
              visual={<MiniBuilderCanvas />}
            />
          </m.div>

          {/* B — Ship */}
          <m.div variants={cardVariants}>
            <FeatureCard
              tinted
              className="h-full"
              icon={<IconDeviceLaptop className="size-5" />}
              title="Ship to any audience"
              description="A public URL by default. Embed anywhere. Mobile-first out of the box."
              visual={<MiniFormRenderer />}
            />
          </m.div>

          {/* C — Real-time */}
          <m.div variants={cardVariants}>
            <FeatureCard
              iconTone="ghost"
              className="h-full"
              icon={<IconUsers className="size-5" />}
              title="Replies, in real time"
              description="Watch submissions land as they happen. Drill into any one to replay against the exact form version."
              visual={<MiniSubmissionsList />}
            />
          </m.div>

          {/* D — Funnel */}
          <m.div variants={cardVariants}>
            <FeatureCard
              iconTone="ghost"
              className="h-full"
              icon={<IconRouteAltLeft className="size-5" />}
              title="Know what's working"
              description="Every form ships with funnel analytics — started, completed, drop-off."
              visual={<MiniFunnel />}
            />
          </m.div>

          {/* E — Wide analytics */}
          <m.div variants={cardVariants} className="md:col-span-2">
            <FeatureCard
              iconTone="ghost"
              className="h-full"
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
          </m.div>
        </m.div>
      </div>
    </section>
  );
}
