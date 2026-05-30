-- ─────────────────────────────────────────────────────────────────────────
-- 0001 — theme tokens dark-mode shape
-- ─────────────────────────────────────────────────────────────────────────
-- Rewrites every row in `themes.tokens` and every non-null
-- `form_versions.theme_snapshot` from the v1 flat shape:
--
--   { brand, colors, typography, surfaces, spacing, background,
--     buttons, inputs, perField }
--
-- to the v1.x palette-nested shape:
--
--   { brand, typography, surfaces, spacing, perField, mode,
--     buttonStyle, inputStyle,
--     palette: { light: { colors, buttons, inputs, background } } }
--
--   - `buttons.{borderRadius,padding,shadow}` → `buttonStyle.*`
--   - `buttons.{backgroundColor,textColor,hoverBackground}` →
--     `palette.light.buttons.*`
--   - `inputs.{borderRadius,borderWidth,padding}` → `inputStyle.*`
--   - `inputs.{backgroundColor,textColor,borderColor,focusBorderColor,
--      focusRingColor,helperColor,errorColor}` → `palette.light.inputs.*`
--   - `colors` → `palette.light.colors`
--   - `background` → `palette.light.background`
--   - `perField` — strip non-color fields from each override
--     (radius/borderWidth/padding) so only color partials remain.
--   - `mode` → "light" (existing themes are conceptually light-only).
--   - `palette.dark` → unset (existing themes have no dark variant).
--
-- Idempotency: each UPDATE has a `WHERE … ? 'colors'` guard so re-running
-- after migration skips rows that already match the new shape. Run before
-- starting the v1.x app code; the new Zod schemas reject the old shape.
--
-- Reversal: not shipped. Roll back by reverting the app code AND restoring
-- the DB from a pre-migration backup. Forward-only by design.

BEGIN;

-- ─── themes.tokens ──────────────────────────────────────────────────────

UPDATE themes
SET tokens = jsonb_build_object(
  'brand',       COALESCE(tokens->'brand', '{}'::jsonb),
  'typography',  tokens->'typography',
  'surfaces',    tokens->'surfaces',
  'spacing',     tokens->'spacing',
  'mode',        'light',
  'buttonStyle', jsonb_build_object(
    'borderRadius', tokens->'buttons'->'borderRadius',
    'padding',      tokens->'buttons'->'padding',
    'shadow',       tokens->'buttons'->'shadow'
  ),
  'inputStyle', jsonb_build_object(
    'borderRadius', tokens->'inputs'->'borderRadius',
    'borderWidth',  tokens->'inputs'->'borderWidth',
    'padding',      tokens->'inputs'->'padding'
  ),
  'palette', jsonb_build_object(
    'light', jsonb_build_object(
      'colors',     tokens->'colors',
      'buttons',    (tokens->'buttons') - 'borderRadius' - 'padding' - 'shadow',
      'inputs',     (tokens->'inputs')  - 'borderRadius' - 'borderWidth' - 'padding',
      'background', tokens->'background'
    )
  ),
  'perField', (
    -- Strip non-color fields from each perField override entry. Returns
    -- an empty object when perField was missing or had no entries.
    SELECT COALESCE(
      jsonb_object_agg(
        entry.key,
        (entry.value - 'borderRadius' - 'borderWidth' - 'padding')
      ),
      '{}'::jsonb
    )
    FROM jsonb_each(COALESCE(tokens->'perField', '{}'::jsonb)) AS entry
  )
)
WHERE tokens ? 'colors';  -- idempotency guard: skip already-migrated rows

-- ─── form_versions.theme_snapshot ───────────────────────────────────────
-- This block used to apply the same transformation to the
-- form_versions.theme_snapshot column. The column was later dropped
-- (live-theme model — public forms read the attached theme's current
-- tokens via JOIN, no snapshot needed). The DO-block below skips the
-- transform on fresh DBs where the column doesn't exist; if you're
-- running an upgrade where the column DOES still exist (legacy data),
-- the original UPDATE runs to keep that legacy data shape-compatible.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'form_versions' AND column_name = 'theme_snapshot'
  ) THEN
    EXECUTE $migrate$
      UPDATE form_versions
      SET theme_snapshot = jsonb_build_object(
        'brand',       COALESCE(theme_snapshot->'brand', '{}'::jsonb),
        'typography',  theme_snapshot->'typography',
        'surfaces',    theme_snapshot->'surfaces',
        'spacing',     theme_snapshot->'spacing',
        'mode',        'light',
        'buttonStyle', jsonb_build_object(
          'borderRadius', theme_snapshot->'buttons'->'borderRadius',
          'padding',      theme_snapshot->'buttons'->'padding',
          'shadow',       theme_snapshot->'buttons'->'shadow'
        ),
        'inputStyle', jsonb_build_object(
          'borderRadius', theme_snapshot->'inputs'->'borderRadius',
          'borderWidth',  theme_snapshot->'inputs'->'borderWidth',
          'padding',      theme_snapshot->'inputs'->'padding'
        ),
        'palette', jsonb_build_object(
          'light', jsonb_build_object(
            'colors',     theme_snapshot->'colors',
            'buttons',    (theme_snapshot->'buttons') - 'borderRadius' - 'padding' - 'shadow',
            'inputs',     (theme_snapshot->'inputs')  - 'borderRadius' - 'borderWidth' - 'padding',
            'background', theme_snapshot->'background'
          )
        ),
        'perField', (
          SELECT COALESCE(
            jsonb_object_agg(
              entry.key,
              (entry.value - 'borderRadius' - 'borderWidth' - 'padding')
            ),
            '{}'::jsonb
          )
          FROM jsonb_each(COALESCE(theme_snapshot->'perField', '{}'::jsonb)) AS entry
        )
      )
      WHERE theme_snapshot IS NOT NULL
        AND theme_snapshot ? 'colors'
    $migrate$;
  END IF;
END $$;

COMMIT;
