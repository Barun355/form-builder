-- ─────────────────────────────────────────────────────────────────────────
-- 0002 — backfill forms.theme_id from form_versions.theme_id
-- ─────────────────────────────────────────────────────────────────────────
-- Theme attachment moved from per-version (form_versions.theme_id) to
-- per-form (forms.theme_id) so theme swaps take effect on the public URL
-- immediately, no re-publish needed.
--
-- Backfill rules (in this order, idempotent — guarded by theme_id IS NULL):
--   1. If the form is published, copy the published version's theme_id.
--   2. Else (draft / no publish ever), copy the LATEST version's theme_id.
--
-- The Drizzle schema migration ADDED forms.theme_id (0007) ran first.
-- A subsequent schema migration drops form_versions.theme_id (the source
-- column) AFTER this backfill. Order: 0007 (ADD) → this (BACKFILL) → 0008 (DROP).

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'form_versions' AND column_name = 'theme_id'
  ) THEN
    -- Rule 1: published forms inherit their published version's theme.
    EXECUTE 'UPDATE forms f
      SET theme_id = (
        SELECT fv.theme_id FROM form_versions fv WHERE fv.id = f.published_version_id
      )
      WHERE f.theme_id IS NULL
        AND f.published_version_id IS NOT NULL';

    -- Rule 2: draft / never-published forms inherit the latest version's theme.
    EXECUTE 'UPDATE forms f
      SET theme_id = (
        SELECT fv.theme_id FROM form_versions fv
        WHERE fv.form_id = f.id
        ORDER BY fv.version DESC
        LIMIT 1
      )
      WHERE f.theme_id IS NULL
        AND f.published_version_id IS NULL';
  END IF;
END $$;

COMMIT;
