const isProd = process.env.NODE_ENV === "production";

// Baseline headers applied to every route. X-Frame-Options is set per-path
// in the headers() block below because public form pages MUST be embeddable.
const baselineSecurityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      // Public form pages — embeddable, no X-Frame-Options.
      {
        source: "/u/:userSlug/:formSlug",
        headers: baselineSecurityHeaders,
      },
      // Everything else — frame-deny same-origin.
      {
        source: "/((?!u/).*)",
        headers: [
          ...baselineSecurityHeaders,
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
