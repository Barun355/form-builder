export function SocialProofBar() {
  return (
    <section className="border-y border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="flex flex-col items-center gap-6">
          <p className="text-caps uppercase text-primary text-xs tracking-wider font-semibold">
            Trusted by indie makers and growing teams
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-12 gap-y-6 items-center">
            <Stat value="1,531" label="forms submitted in beta" />
            <Stat value="10+" label="ready-made templates" />
            <Stat value="< 2 min" label="average build time" />
            <Stat value="99.9%" label="uptime, last 30 days" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-h3 text-foreground tabular-nums tracking-tight">
        {value}
      </p>
      <p className="text-body-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
