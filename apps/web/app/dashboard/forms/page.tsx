"use client";

import { CreateFormDialog } from "~/components/create-form-dialog";
import { DashboardShell } from "~/components/dashboard-shell";
import { FormsTable } from "~/components/forms-table";

export default function FormsPage() {
  return (
    <DashboardShell>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex items-start justify-between gap-4 px-4 lg:px-6">
              <div>
                <h1 className="text-h1 text-foreground">Forms</h1>
                <p className="text-body text-muted-foreground mt-1">
                  Build, publish, and analyze your forms.
                </p>
              </div>
              <CreateFormDialog />
            </div>
            <div className="px-4 lg:px-6">
              <FormsTable />
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
