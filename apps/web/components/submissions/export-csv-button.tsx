"use client";

import { IconDownload } from "@tabler/icons-react";
import { Button } from "~/components/ui/button";

type Props = {
  formId: string;
  status?: "started" | "completed" | undefined;
  dateFrom?: string;
  dateTo?: string;
};

export function ExportCsvButton({ formId, status, dateFrom, dateTo }: Props) {
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  const qs = params.toString();
  const href = `${apiBase}/api/forms/${formId}/export.csv${qs ? `?${qs}` : ""}`;

  return (
    <Button asChild variant="outline" size="sm">
      <a href={href} download>
        <IconDownload className="size-4" />
        Export CSV
      </a>
    </Button>
  );
}
