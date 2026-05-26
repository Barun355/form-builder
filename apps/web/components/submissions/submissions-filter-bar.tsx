"use client";

import * as React from "react";
import { IconSearch } from "@tabler/icons-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";

export type SubmissionStatusFilter = "all" | "started" | "completed";

export type SubmissionsFilters = {
  status: SubmissionStatusFilter;
  search: string;
  dateFrom: string; // YYYY-MM-DD
  dateTo: string;
};

type Props = {
  filters: SubmissionsFilters;
  onChange: (patch: Partial<SubmissionsFilters>) => void;
};

const STATUS_OPTIONS: { value: SubmissionStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "started", label: "Started" },
  { value: "completed", label: "Completed" },
];

export function SubmissionsFilterBar({ filters, onChange }: Props) {
  const [searchInput, setSearchInput] = React.useState(filters.search);

  React.useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  React.useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== filters.search) {
        onChange({ search: searchInput });
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-1 bg-muted rounded-full p-1 w-fit">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange({ status: opt.value })}
            className={cn(
              "px-3 py-1 text-body-sm font-medium rounded-full transition-colors duration-150",
              filters.status === opt.value
                ? "bg-card shadow-xs text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search responses..."
            className="h-9 pl-9 w-64"
          />
        </div>

        <Input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => onChange({ dateFrom: e.target.value })}
          className="h-9 w-40"
          aria-label="From"
        />
        <Input
          type="date"
          value={filters.dateTo}
          onChange={(e) => onChange({ dateTo: e.target.value })}
          className="h-9 w-40"
          aria-label="To"
        />

        {(filters.status !== "all" ||
          filters.search ||
          filters.dateFrom ||
          filters.dateTo) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onChange({
                status: "all",
                search: "",
                dateFrom: "",
                dateTo: "",
              })
            }
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
