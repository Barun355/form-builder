import { trpc } from "~/trpc/client";

export const useSaveDraft = () => {
  const utils = trpc.useUtils();
  return trpc.formVersion.saveDraft.useMutation({
    onSuccess: (data) => {
      // Form's latestVersion changed — invalidate form detail.
      utils.form.getFormById.invalidate({ id: data.formId });
      utils.formVersion.listVersions.invalidate({ formId: data.formId });
    },
  });
};

export const useFormVersions = (
  formId: string | undefined,
  opts?: { limit?: number; offset?: number },
) => {
  const enabled = Boolean(formId);
  const { data, isLoading, isFetching, isError, error, refetch } =
    trpc.formVersion.listVersions.useQuery(
      {
        formId: formId ?? "",
        limit: opts?.limit,
        offset: opts?.offset,
      },
      { enabled },
    );

  return {
    items: data?.items ?? [],
    totalCount: data?.totalCount ?? 0,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  };
};

export const useFormVersion = (id: string | undefined) => {
  const enabled = Boolean(id);
  return trpc.formVersion.getVersion.useQuery(
    { id: id ?? "" },
    { enabled },
  );
};

export const useRevertToVersion = () => {
  const utils = trpc.useUtils();
  return trpc.formVersion.revertToVersion.useMutation({
    onSuccess: (data) => {
      utils.form.getFormById.invalidate({ id: data.formId });
      utils.formVersion.listVersions.invalidate({ formId: data.formId });
    },
  });
};

export const useDeleteVersion = () => {
  const utils = trpc.useUtils();
  return trpc.formVersion.deleteVersion.useMutation({
    onSuccess: () => {
      // We don't know formId from the response; invalidate broadly.
      utils.formVersion.listVersions.invalidate();
      utils.form.getFormById.invalidate();
    },
  });
};
