ALTER TABLE "form_versions" DROP CONSTRAINT "form_versions_theme_id_themes_id_fk";
--> statement-breakpoint
DROP INDEX "form_versions_theme_id_idx";--> statement-breakpoint
ALTER TABLE "form_versions" DROP COLUMN "theme_id";