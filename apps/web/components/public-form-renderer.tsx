"use client";

import * as React from "react";
import { IconCircleCheck, IconLock } from "@tabler/icons-react";

import { Button } from "~/components/ui/button";
import { FormRenderer } from "~/components/form-renderer";
import { ThemeStyle } from "~/components/theme-style";
import { cn } from "~/lib/utils";
import type { FormSchemaI } from "@repo/database/models/form-versions";
import type { ThemeTokensI } from "@repo/theme";
import {
  useCompleteSubmission,
  useStartSubmission,
} from "~/hooks/form-submissions";

type Props = {
  formTitle: string;
  formDescription?: string;
  status: "published" | "closed";
  versionId: string;
  schema: FormSchemaI;
  /**
   * Theme tokens snapshot from the form version. `null` renders the
   * platform default look. Read-only on the client — never trusted as
   * input, never editable here.
   */
  theme?: ThemeTokensI | null;
};

type ClientMeta = {
  locale: string;
  timezone: string;
  screenResolution: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

function collectClientMeta(): ClientMeta | undefined {
  if (typeof window === "undefined") return undefined;
  const params = new URLSearchParams(window.location.search);
  return {
    locale: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenResolution: `${window.innerWidth}x${window.innerHeight}`,
    referrer: document.referrer || undefined,
    utmSource: params.get("utm_source") ?? undefined,
    utmMedium: params.get("utm_medium") ?? undefined,
    utmCampaign: params.get("utm_campaign") ?? undefined,
  };
}

type Phase = "idle" | "preparing" | "submitting";

export function PublicFormRenderer({
  formTitle,
  formDescription,
  status,
  versionId,
  schema,
  theme = null,
}: Props) {
  const { mutateAsync: startAsync } = useStartSubmission();
  const { mutateAsync: completeAsync } = useCompleteSubmission();

  const [submissionId, setSubmissionId] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);
  const [resetKey, setResetKey] = React.useState(0);
  const [phase, setPhase] = React.useState<Phase>("idle");

  const startedRef = React.useRef(false);
  const startPromiseRef = React.useRef<Promise<{ id: string }> | null>(null);

  /**
   * Fire `start` exactly once per session, when the user first interacts with
   * the form area (focus a field, click on a page/section). Pre-interaction
   * page views don't create rows — funnel data captures actual engagement.
   */
  const ensureStarted = React.useCallback(() => {
    if (status !== "published") return;
    if (startedRef.current) return;
    startedRef.current = true;

    const promise = startAsync({
      versionId,
      meta: collectClientMeta(),
      honeypot: "",
    });
    startPromiseRef.current = promise;
    promise
      .then(({ id }) => setSubmissionId(id))
      .catch(() => {
        // start failed — release the ref so a later submit will retry inline
        startedRef.current = false;
        startPromiseRef.current = null;
      });
  }, [status, versionId, startAsync]);

  async function handleSubmit(
    values: Record<string, unknown>,
    extras: { honeypot: string },
  ) {
    let id = submissionId;

    // 1. If start is in-flight (user focused, then submitted fast), await it.
    if (!id && startPromiseRef.current) {
      setPhase("preparing");
      try {
        const result = await startPromiseRef.current;
        id = result.id;
      } catch {
        // start failed — try inline below
      }
    }

    // 2. If start never fired (user typed-and-submitted in <100ms,
    //    or somehow bypassed interaction tracking), fire it inline.
    if (!id) {
      setPhase("preparing");
      try {
        const result = await startAsync({
          versionId,
          meta: collectClientMeta(),
          honeypot: "",
        });
        id = result.id;
      } catch {
        // Even inline start failed — we'll still let the backend INSERT a
        // fresh row in the complete call (it falls back to versionId).
      }
    }

    // 3. Always send versionId + (if we have it) submissionId as upgrade hint.
    setPhase("submitting");
    try {
      await completeAsync({
        submissionId: id ?? undefined,
        versionId,
        data: values,
        meta: id ? undefined : collectClientMeta(),
        honeypot: extras.honeypot,
      });
      setSubmitted(true);
    } finally {
      setPhase("idle");
    }
  }

  function resetForm() {
    setSubmissionId(null);
    setSubmitted(false);
    startedRef.current = false;
    startPromiseRef.current = null;
    setPhase("idle");
    setResetKey((k) => k + 1);
  }

  // Auto-redirect after thank-you if configured
  React.useEffect(() => {
    if (!submitted) return;
    const redirectUrl = schema.thankYou?.redirectUrl;
    if (!redirectUrl) return;
    const delay = schema.thankYou?.redirectDelayMs ?? 3000;
    const t = setTimeout(() => {
      window.location.assign(redirectUrl);
    }, delay);
    return () => clearTimeout(t);
  }, [submitted, schema.thankYou]);

  if (submitted) {
    return <ThankYouScreen schema={schema} onReset={resetForm} />;
  }

  const submitLabel =
    phase === "preparing"
      ? "Preparing..."
      : phase === "submitting"
        ? "Submitting..."
        : "Submit";

  return (
    // Outer full-bleed div carries `data-sf-root` so the compiled theme
    // CSS paints the WHOLE page background (solid / gradient / image),
    // not just the constrained card area. Inner `.sf-card` div gets the
    // theme's surface color + radius + shadow via the compiler's
    // `[data-sf-root] .sf-card` rule. This two-layer split is the
    // contract the compiler expects — see packages/theme/compile.ts.
    //
    // Mode class:
    //   mode=light → .sf-light  (force light, ignore OS pref)
    //   mode=dark  → .sf-dark   (force dark,  ignore OS pref)
    //   mode=auto  → no class   (let the compiler's
    //                            @media (prefers-color-scheme: dark) decide)
    <div
      className={cn(
        "min-h-screen sf-form",
        theme?.mode === "light" && "sf-light",
        theme?.mode === "dark" && "sf-dark",
      )}
      data-sf-root
    >
      <ThemeStyle tokens={theme} />
      <div className="mx-auto w-full max-w-2xl px-6 py-12">
        {status === "closed" ? (
          <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 mb-6 flex items-center gap-3">
            <IconLock className="size-4 text-warning shrink-0" />
            <p className="text-body-sm text-warning">
              This form is no longer accepting submissions.
            </p>
          </div>
        ) : null}

        <div className="sf-card">
          <header className="mb-8">
            <h1 data-sf-heading="1">{formTitle}</h1>
            {formDescription ? (
              <p className="mt-2" data-sf-section-description>
                {formDescription}
              </p>
            ) : null}
          </header>

          {/*
            First focus/click anywhere inside this wrapper triggers `start`.
            React's synthetic onFocus bubbles, so it catches focus on any
            descendant input. onClick covers page-tab / section clicks too.
          */}
          <div onFocus={ensureStarted} onClick={ensureStarted}>
            <FormRenderer
              key={resetKey}
              schema={schema}
              mode="live"
              onSubmit={handleSubmit}
              readOnly={status === "closed"}
              withHoneypot
              isSubmitting={phase !== "idle"}
              submitLabel={submitLabel}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ThankYouScreen({
  schema,
  onReset,
}: {
  schema: FormSchemaI;
  onReset: () => void;
}) {
  const ty = schema.thankYou;
  const title = ty?.title ?? "Thank you";
  const message = ty?.message ?? "Your response has been recorded.";
  const showAnother = Boolean(ty?.showSubmitAnotherButton);
  const delaySec = ty?.redirectUrl
    ? Math.max(1, Math.round((ty.redirectDelayMs ?? 3000) / 1000))
    : null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="size-16 rounded-2xl bg-success/10 text-success flex items-center justify-center mb-6">
        <IconCircleCheck className="size-8" />
      </div>
      <h1 className="text-h1 text-foreground mb-2">{title}</h1>
      <p className="text-body text-muted-foreground max-w-md mb-6 whitespace-pre-wrap">
        {message}
      </p>
      {showAnother ? (
        <Button variant="outline" onClick={onReset}>
          Submit another response
        </Button>
      ) : null}
      {delaySec !== null && ty?.redirectUrl ? (
        <p className="text-body-sm text-muted-foreground mt-4">
          Redirecting to{" "}
          <span className="font-mono">{new URL(ty.redirectUrl).host}</span> in{" "}
          {delaySec}s…
        </p>
      ) : null}
    </div>
  );
}
