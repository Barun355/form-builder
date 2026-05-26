import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js middleware: per-response augmentation that next.config.js's
 * static `headers()` can't express.
 *
 * 1. Adds X-Request-Id (correlates with API logs)
 * 2. On public form pages (/u/*), permits cross-origin embedding via
 *    Access-Control-Allow-Origin: * — so a form embedded on a third-party
 *    site can fetch its own page payload over fetch() / iframe.
 */
export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // 16-char nanoid-ish ID without pulling in the nanoid dep at the edge.
  const requestId = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  res.headers.set("X-Request-Id", requestId);

  // Public form pages: allow embedding/fetching from any origin.
  // We never set credentials=true here, so cookies are not exposed cross-site.
  if (req.nextUrl.pathname.startsWith("/u/")) {
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.headers.set("Vary", "Origin");
  }

  return res;
}

export const config = {
  // Skip Next.js internals and static assets — matters for performance and
  // to keep dev-tools / HMR responses untouched.
  matcher: ["/((?!_next/|favicon|fonts/|.*\\.(?:png|jpg|jpeg|svg|gif|ico)$).*)"],
};
