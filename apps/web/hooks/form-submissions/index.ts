import { trpc } from "~/trpc/client";
import { toast } from "sonner";

export const useStartSubmission = () => {
  return trpc.formSubmissions.start.useMutation();
};

export const useCompleteSubmission = () => {
  return trpc.formSubmissions.complete.useMutation({
    onError: (err) => {
      toast.error(`Submission failed: ${err.message}`);
    },
  });
};

type ListFilters = {
  status?: "started" | "completed";
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
};

export const useFormSubmissions = (
  formId: string | undefined,
  filters: ListFilters = {},
  opts: { limit?: number } = {},
) => {
  const enabled = Boolean(formId);
  return trpc.formSubmissions.list.useInfiniteQuery(
    {
      formId: formId ?? "",
      status: filters.status,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      search: filters.search,
      limit: opts.limit,
    },
    {
      enabled,
      getNextPageParam: (lastPage) => lastPage?.nextCursor,
      initialCursor: undefined,
    },
  );
};

export const useFormSubmission = (id: string | undefined) => {
  const enabled = Boolean(id);
  return trpc.formSubmissions.get.useQuery(
    { id: id ?? "" },
    { enabled },
  );
};
