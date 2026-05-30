"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { IconShieldCheck } from "@tabler/icons-react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { ThemePicker } from "~/components/theme-picker";
import { useCreateForm, useDefaultThemeForCreate, useForms } from "~/hooks/form";
import { useUser } from "~/hooks/auth";

// Mirrors PLANS.free.formLimit / PLANS.free.monthlySubmissionsVisible
// from packages/services/plans.ts. Hardcoded here because we can't import
// server-only consts into the client; the values rarely change and any
// drift is caught by the route-level enforcement.
const FREE_FORM_LIMIT = 3;
const FREE_MONTHLY_VISIBLE = 100;

type CreateFormValues = {
  title: string;
  description?: string;
};

export function CreateFormDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateFormValues>();

  const { createFormAsync, isPending } = useCreateForm();
  const { user } = useUser();
  const { totalCount } = useForms({ limit: 1 });
  const { themeId: defaultThemeId } = useDefaultThemeForCreate();

  // Theme selection lives outside react-hook-form because the picker is
  // a controlled component with non-input semantics. Re-syncs to the
  // default when it loads and when the dialog re-opens.
  const [themeId, setThemeId] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (open) setThemeId(defaultThemeId);
  }, [open, defaultThemeId]);

  const isFreePlan = user?.plan === "free";
  const formCount = totalCount ?? 0;
  const atCap = isFreePlan && formCount >= FREE_FORM_LIMIT;

  const onSubmit = async (values: CreateFormValues) => {
    try {
      const { id } = await createFormAsync({
        title: values.title,
        description: values.description?.trim()
          ? values.description
          : undefined,
        themeId,
      });
      reset();
      setOpen(false);
      router.push(`/dashboard/forms/${id}/edit`);
    } catch (err) {
      // Server-side PLAN_LOCKED:form_limit surfaces as a TRPCError with
      // data.planLocked === "form_limit". Surface a friendly toast.
      const msg = err instanceof Error ? err.message : "Failed to create form";
      if (msg.includes("PLAN_LOCKED:form_limit")) {
        toast.error(
          `You've reached the ${FREE_FORM_LIMIT}-form Free plan limit. Upgrade for unlimited forms.`,
        );
      } else {
        toast.error(msg);
      }
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Create new form
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new form</DialogTitle>
          <DialogDescription>
            Give your form a title and an optional description.
          </DialogDescription>
        </DialogHeader>

        {/* Form quota indicator — only visible to Free users */}
        {isFreePlan ? (
          <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-body-sm flex items-center justify-between gap-3">
            <span className="text-foreground">
              <span className="font-medium tabular-nums">
                {formCount}
              </span>{" "}
              <span className="text-muted-foreground">
                of {FREE_FORM_LIMIT} forms used
              </span>
            </span>
            {atCap ? (
              <Link
                href="/#pricing"
                className="text-primary hover:underline font-medium"
              >
                Upgrade →
              </Link>
            ) : null}
          </div>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="title">Title</FieldLabel>
              <Input
                id="title"
                type="text"
                placeholder="Customer feedback"
                maxLength={55}
                required
                disabled={atCap}
                {...register("title", {
                  required: "Title is required",
                  minLength: 1,
                  maxLength: 55,
                })}
              />
              {errors.title?.message ? (
                <FieldDescription className="text-destructive">
                  {errors.title.message}
                </FieldDescription>
              ) : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="description">
                Description{" "}
                <span className="text-muted-foreground">(optional)</span>
              </FieldLabel>
              <Textarea
                id="description"
                placeholder="What is this form about?"
                maxLength={255}
                rows={3}
                disabled={atCap}
                {...register("description", { maxLength: 255 })}
              />
            </Field>
            <Field>
              <FieldLabel>
                Theme{" "}
                <span className="text-muted-foreground">(optional)</span>
              </FieldLabel>
              <ThemePicker
                value={themeId}
                onChange={setThemeId}
                disabled={atCap}
              />
              <FieldDescription>
                Pre-filled with your last used theme. Change anytime from
                the form&apos;s settings.
              </FieldDescription>
            </Field>
          </FieldGroup>

          {/* Trust signal — surfaces upfront to ALL plans. Reassures users
              their submissions are never blocked, even on Free's visibility cap. */}
          <div className="mt-5 rounded-lg border border-success/30 bg-success/10 px-4 py-3 flex gap-3">
            <IconShieldCheck className="size-5 text-success shrink-0 mt-0.5" />
            <div className="text-body-sm">
              <p className="text-foreground font-medium">
                Your data is safe — submissions never stop
              </p>
              <p className="text-muted-foreground mt-0.5">
                {isFreePlan ? (
                  <>
                    Your form will always accept submissions, regardless of
                    your plan. On Free, you&apos;ll see the latest{" "}
                    {FREE_MONTHLY_VISIBLE} responses per month — older ones
                    are safely stored and unlock when you upgrade. We never
                    drop data.
                  </>
                ) : (
                  <>
                    Your forms accept unlimited submissions with full
                    visibility. You never lose data.
                  </>
                )}
              </p>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              loading={isPending}
              loadingText="Creating…"
              disabled={atCap}
            >
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
