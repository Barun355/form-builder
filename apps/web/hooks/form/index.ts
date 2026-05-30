import { trpc } from "~/trpc/client";
import type { RouterInputs } from "@repo/trpc/client";

type ListFormsInput = RouterInputs["form"]["listForms"];

export const useCreateForm = () => {
  const utils = trpc.useUtils();

  const {
    mutateAsync: createFormAsync,
    mutate: createForm,
    error,
    failureCount,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.form.createForm.useMutation({
    onSuccess: () => {
      utils.form.listForms.invalidate();
      utils.dashboard.stats.invalidate();
    },
  });

  return {
    createForm,
    createFormAsync,
    error,
    failureCount,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  };
};

export const useForm = (id: string | undefined) => {
  const {
    data,
    isLoading,
    isFetching,
    isError,
    isSuccess,
    error,
    refetch,
  } = trpc.form.getFormById.useQuery(
    { id: id ?? "" },
    { enabled: Boolean(id) },
  );

  return {
    form: data,
    isLoading,
    isFetching,
    isError,
    isSuccess,
    error,
    refetch,
  };
};

export const useForms = (input: ListFormsInput = {}) => {
  const {
    data,
    isLoading,
    isFetching,
    isError,
    isSuccess,
    error,
    refetch,
  } = trpc.form.listForms.useQuery(input);

  return {
    items: data?.items ?? [],
    totalCount: data?.totalCount ?? 0,
    isLoading,
    isFetching,
    isError,
    isSuccess,
    error,
    refetch,
  };
};

export const useUpdateForm = () => {
  const utils = trpc.useUtils();

  const {
    mutateAsync: updateFormAsync,
    mutate: updateForm,
    error,
    isError,
    isPending,
    isSuccess,
    status,
  } = trpc.form.updateForm.useMutation({
    onSuccess: (data) => {
      utils.form.listForms.invalidate();
      utils.form.getFormById.invalidate({ id: data.id });
    },
  });

  return {
    updateForm,
    updateFormAsync,
    error,
    isError,
    isPending,
    isSuccess,
    status,
  };
};

export const useSoftDeleteForm = () => {
  const utils = trpc.useUtils();

  const {
    mutateAsync: softDeleteFormAsync,
    mutate: softDeleteForm,
    error,
    isError,
    isPending,
    isSuccess,
    status,
  } = trpc.form.softDeleteForm.useMutation({
    onSuccess: () => {
      utils.form.listForms.invalidate();
      utils.dashboard.stats.invalidate();
    },
  });

  return {
    softDeleteForm,
    softDeleteFormAsync,
    error,
    isError,
    isPending,
    isSuccess,
    status,
  };
};

export const useDuplicateForm = () => {
  const utils = trpc.useUtils();

  const {
    mutateAsync: duplicateFormAsync,
    mutate: duplicateForm,
    error,
    isError,
    isPending,
    isSuccess,
    status,
  } = trpc.form.duplicateForm.useMutation({
    onSuccess: () => {
      utils.form.listForms.invalidate();
      utils.dashboard.stats.invalidate();
    },
  });

  return {
    duplicateForm,
    duplicateFormAsync,
    error,
    isError,
    isPending,
    isSuccess,
    status,
  };
};

// ─── State transitions ─────────────────────────────────────────────────────

/**
 * Live theme attach/detach. Single UPDATE on `forms.theme_id`; the public
 * URL reflects the new theme on its next render (no re-publish needed).
 * Invalidates `form.getFormById` so the builder picks up the change.
 */
export const useSetFormTheme = () => {
  const utils = trpc.useUtils();
  return trpc.form.setTheme.useMutation({
    onSuccess: (data) => {
      utils.form.getFormById.invalidate({ id: data.id });
      // Also invalidate the lastUsedThemeId default for the new-form dialog.
      utils.form.lastUsedThemeId.invalidate();
    },
  });
};

export const usePublishForm = () => {
  const utils = trpc.useUtils();
  return trpc.form.publishForm.useMutation({
    onSuccess: (data) => {
      utils.form.listForms.invalidate();
      utils.form.getFormById.invalidate({ id: data.id });
    },
  });
};

export const useUnpublishForm = () => {
  const utils = trpc.useUtils();
  return trpc.form.unpublishForm.useMutation({
    onSuccess: (data) => {
      utils.form.listForms.invalidate();
      utils.form.getFormById.invalidate({ id: data.id });
    },
  });
};

export const useArchiveForm = () => {
  const utils = trpc.useUtils();
  return trpc.form.archiveForm.useMutation({
    onSuccess: (data) => {
      utils.form.listForms.invalidate();
      utils.form.getFormById.invalidate({ id: data.id });
    },
  });
};

export const useCloseForm = () => {
  const utils = trpc.useUtils();
  return trpc.form.closeForm.useMutation({
    onSuccess: (data) => {
      utils.form.listForms.invalidate();
      utils.form.getFormById.invalidate({ id: data.id });
    },
  });
};

export const useRestoreForm = () => {
  const utils = trpc.useUtils();
  return trpc.form.restoreForm.useMutation({
    onSuccess: (data) => {
      utils.form.listForms.invalidate();
      utils.form.getFormById.invalidate({ id: data.id });
    },
  });
};

export const usePublicForm = (
  args: { userSlug: string | undefined; formSlug: string | undefined },
) => {
  const enabled = Boolean(args.userSlug && args.formSlug);
  const { data, isLoading, isFetching, isError, error, refetch } =
    trpc.form.getByPublicSlug.useQuery(
      { userSlug: args.userSlug ?? "", formSlug: args.formSlug ?? "" },
      { enabled },
    );

  return { form: data, isLoading, isFetching, isError, error, refetch };
};

/**
 * Pre-selects the theme in the New-form dialog. Returns the most
 * recently used theme id across the caller's own forms, or null when
 * the user has no themed forms (first-time experience — System Default
 * stays selected).
 *
 * Loaded once at dialog mount; not refetched on focus because the
 * "default" is a stable UX hint, not a live value.
 */
export const useDefaultThemeForCreate = () => {
  const { data, isLoading } = trpc.form.lastUsedThemeId.useQuery(
    {},
    {
      refetchOnWindowFocus: false,
      staleTime: Number.POSITIVE_INFINITY,
    },
  );
  return { themeId: data?.themeId ?? null, isLoading };
};
