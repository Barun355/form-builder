import type { Request, Response } from "express";
import { verifyToken } from "@repo/services/auth";
import FormSubmissionsService from "@repo/services/form-submissions";

const submissionsService = new FormSubmissionsService();

/**
 * GET /api/forms/:id/export.csv
 *
 * Streams CSV of submissions for the given form. Auth via the same cookie
 * the tRPC `protectedProcedure` uses. Query params: status, dateFrom, dateTo.
 */
export async function exportFormSubmissionsCsv(
  req: Request,
  res: Response,
): Promise<void> {
  // Auth — read the same cookie name `protectedProcedure` checks.
  const token = req.cookies?.["authentication-token"] as string | undefined;
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  let userId: string;
  try {
    const payload = verifyToken(token);
    if (!payload?.id) throw new Error("invalid payload");
    userId = payload.id;
  } catch {
    res.status(401).json({ error: "Invalid session" });
    return;
  }

  const formId = req.params.id;
  if (!formId) {
    res.status(400).json({ error: "Missing form id" });
    return;
  }

  const status = req.query.status as string | undefined;
  const dateFromRaw = req.query.dateFrom as string | undefined;
  const dateToRaw = req.query.dateTo as string | undefined;

  const filename = `submissions-${formId}-${new Date().toISOString().slice(0, 10)}.csv`;

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"`,
  );

  try {
    await submissionsService.exportToWritable(
      {
        formId,
        requestedBy: userId,
        status:
          status === "started" || status === "completed" ? status : undefined,
        dateFrom: dateFromRaw ? new Date(dateFromRaw) : undefined,
        dateTo: dateToRaw ? new Date(dateToRaw) : undefined,
      },
      res,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export failed";
    const lower = message.toLowerCase();
    if (!res.headersSent) {
      if (lower.includes("forbidden")) {
        res.status(403).json({ error: message });
      } else if (lower.includes("not found")) {
        res.status(404).json({ error: message });
      } else {
        res.status(500).json({ error: message });
      }
    } else {
      // Headers already flushed — just end the stream.
      res.end();
    }
  }
}
