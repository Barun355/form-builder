import { trpc } from "~/trpc/client";
import type { RouterInputs } from "@repo/trpc/client";

type ListThemesInput = RouterInputs["theme"]["list"];

export const useThemes = (input: ListThemesInput = {}) => {
  const {
    data,
    isLoading,
    isFetching,
    isError,
    isSuccess,
    error,
    refetch,
  } = trpc.theme.list.useQuery(input);

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

/**
 * How many currently-published forms render with this theme's snapshot.
 * Drives the "N forms use a snapshot…" caption in the theme editor.
 * Read-only count; cheap; no need to refetch on window focus.
 */
export const useThemeUsageCount = (id: string | undefined) => {
  const { data, isLoading } = trpc.theme.usageCount.useQuery(
    { id: id ?? "" },
    {
      enabled: Boolean(id),
      refetchOnWindowFocus: false,
    },
  );
  return { count: data?.count ?? 0, isLoading };
};

export const useTheme = (id: string | undefined) => {
  const {
    data,
    isLoading,
    isFetching,
    isError,
    isSuccess,
    error,
    refetch,
  } = trpc.theme.getById.useQuery(
    { id: id ?? "" },
    { enabled: Boolean(id) },
  );

  return {
    theme: data,
    isLoading,
    isFetching,
    isError,
    isSuccess,
    error,
    refetch,
  };
};

export const useCreateTheme = () => {
  const utils = trpc.useUtils();

  const {
    mutateAsync: createThemeAsync,
    mutate: createTheme,
    error,
    isError,
    isPending,
    isSuccess,
    status,
  } = trpc.theme.create.useMutation({
    onSuccess: () => {
      utils.theme.list.invalidate();
    },
  });

  return {
    createTheme,
    createThemeAsync,
    error,
    isError,
    isPending,
    isSuccess,
    status,
  };
};

export const useUpdateTheme = () => {
  const utils = trpc.useUtils();

  const {
    mutateAsync: updateThemeAsync,
    mutate: updateTheme,
    error,
    isError,
    isPending,
    isSuccess,
    status,
  } = trpc.theme.update.useMutation({
    onSuccess: (data) => {
      utils.theme.list.invalidate();
      // Invalidate the specific theme so the editor re-fetches fresh data.
      if (data?.id) utils.theme.getById.invalidate({ id: data.id });
    },
  });

  return {
    updateTheme,
    updateThemeAsync,
    error,
    isError,
    isPending,
    isSuccess,
    status,
  };
};

export const useSoftDeleteTheme = () => {
  const utils = trpc.useUtils();

  const {
    mutateAsync: softDeleteThemeAsync,
    mutate: softDeleteTheme,
    error,
    isError,
    isPending,
    isSuccess,
    status,
  } = trpc.theme.softDelete.useMutation({
    onSuccess: () => {
      utils.theme.list.invalidate();
    },
  });

  return {
    softDeleteTheme,
    softDeleteThemeAsync,
    error,
    isError,
    isPending,
    isSuccess,
    status,
  };
};

export const useDuplicateTheme = () => {
  const utils = trpc.useUtils();

  const {
    mutateAsync: duplicateThemeAsync,
    mutate: duplicateTheme,
    error,
    isError,
    isPending,
    isSuccess,
    status,
  } = trpc.theme.duplicate.useMutation({
    onSuccess: () => {
      utils.theme.list.invalidate();
    },
  });

  return {
    duplicateTheme,
    duplicateThemeAsync,
    error,
    isError,
    isPending,
    isSuccess,
    status,
  };
};

export const usePublishTheme = () => {
  const utils = trpc.useUtils();

  const {
    mutateAsync: publishThemeAsync,
    mutate: publishTheme,
    error,
    isError,
    isPending,
    isSuccess,
    status,
  } = trpc.theme.publish.useMutation({
    onSuccess: (data) => {
      utils.theme.list.invalidate();
      if (data?.id) utils.theme.getById.invalidate({ id: data.id });
    },
  });

  return {
    publishTheme,
    publishThemeAsync,
    error,
    isError,
    isPending,
    isSuccess,
    status,
  };
};

export const useUnpublishTheme = () => {
  const utils = trpc.useUtils();

  const {
    mutateAsync: unpublishThemeAsync,
    mutate: unpublishTheme,
    error,
    isError,
    isPending,
    isSuccess,
    status,
  } = trpc.theme.unpublish.useMutation({
    onSuccess: (data) => {
      utils.theme.list.invalidate();
      if (data?.id) utils.theme.getById.invalidate({ id: data.id });
    },
  });

  return {
    unpublishTheme,
    unpublishThemeAsync,
    error,
    isError,
    isPending,
    isSuccess,
    status,
  };
};
