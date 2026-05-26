import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { SectionHeader } from "~/components/landing/motion/section-header";

const FAQS = [
  {
    q: "Is my data secure?",
    a: "Yes. All submissions are stored in a managed Postgres database with encrypted backups. We never use your form data for training, advertising, or any third-party purpose. Export everything any time as CSV.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes — there's no contract on any paid plan. Cancel from your dashboard and billing stops immediately; your forms keep working through the end of the period you paid for.",
  },
  {
    q: "What happens if I exceed the Free tier limit?",
    a: "Your form stays online and we'll never silently lose a submission. You'll see a friendly nudge in the dashboard to upgrade — and the Pro trial is fourteen days, no card up front.",
  },
  {
    q: "Can I embed forms on my own site?",
    a: "Yes. Every published form has a public URL you can iframe, or use the lightweight script tag for an inline render. Mobile, dark mode, and right-to-left languages all work out of the box.",
  },
  {
    q: "Do you offer a discount for students or nonprofits?",
    a: "Yes — students get Pro free, and registered nonprofits get 50% off Business. Drop us a note at hello@simpleform.app with proof and we'll set it up the same day.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          align="center"
          eyebrow="FAQ"
          title="Questions, answered."
          titleClassName="text-display-md"
        />

        <Accordion type="single" collapsible className="mt-10 space-y-2">
          {FAQS.map((f) => (
            <AccordionItem
              key={f.q}
              value={f.q}
              className="rounded-xl border border-border bg-card px-5"
            >
              <AccordionTrigger className="text-body text-foreground hover:no-underline py-5">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-body text-muted-foreground pb-5">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <p className="mt-10 text-center text-body-sm text-muted-foreground">
          Still curious?{" "}
          <a
            href="mailto:hello@simpleform.app"
            className="text-primary hover:underline"
          >
            Drop us a line
          </a>
          .
        </p>
      </div>
    </section>
  );
}
