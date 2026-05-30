// `@repo/theme` — pure, client-safe theme domain.
//
// Anything that runs in both the browser and the server lives here. The
// package has zero deps on @repo/database, @repo/services, or anything
// node-only — that lets web consume it without dragging server modules
// into its bundle. The bundler boundary is enforced by the absence of a
// package edge, not by discipline.
//
// What belongs here:
//   - The ThemeTokensI document shape and every sub-type.
//   - Font / enum allow-lists used by both runtime validators and types.
//   - The token → CSS compiler (pure function, used by public renderer
//     and editor preview alike).
//   - Default and preset token documents.
//   - Validation helpers (URL allow-list, size cap, contrast advisor).
//   - Zod schemas for tokens and service-layer input parsing.
//
// What does NOT belong here:
//   - Anything that talks to Postgres. Those live in @repo/services.
//   - Drizzle table definitions. Those live in @repo/database.
//   - React components. If a future split adds a theme-ui package, this
//     stays the data/logic layer; the components go there.

export * from "./types";
export * from "./enums";
export * from "./fonts";
export * from "./defaults";
export * from "./validate";
export * from "./compile";
export * from "./model";
