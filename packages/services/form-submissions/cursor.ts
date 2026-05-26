export interface ListCursor {
  ts: string; // ISO timestamp of submittedAt ?? startedAt
  id: string;
}

export function encodeCursor(
  submittedAt: Date | null,
  startedAt: Date,
  id: string,
): string {
  const ts = (submittedAt ?? startedAt).toISOString();
  return Buffer.from(JSON.stringify({ ts, id })).toString("base64url");
}

export function decodeCursor(cursor: string): ListCursor {
  try {
    const json = Buffer.from(cursor, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as Partial<ListCursor>;
    if (typeof parsed.ts !== "string" || typeof parsed.id !== "string") {
      throw new Error("malformed");
    }
    return { ts: parsed.ts, id: parsed.id };
  } catch {
    throw new Error("Invalid cursor");
  }
}
