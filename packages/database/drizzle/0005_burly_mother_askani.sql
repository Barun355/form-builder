CREATE TYPE "public"."theme_category" AS ENUM('standard', 'branded', 'event', 'retro', 'dark', 'high_contrast', 'minimal', 'other');--> statement-breakpoint
CREATE TYPE "public"."theme_visibility" AS ENUM('PRIVATE', 'PUBLIC');--> statement-breakpoint
CREATE TABLE "themes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_by" uuid NOT NULL,
	"name" varchar(80) NOT NULL,
	"description" varchar(255),
	"category" "theme_category" DEFAULT 'standard' NOT NULL,
	"cover_image_url" text,
	"visibility" "theme_visibility" DEFAULT 'PRIVATE' NOT NULL,
	"tokens" jsonb NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "form_versions" ADD COLUMN "theme_id" uuid;--> statement-breakpoint
ALTER TABLE "form_versions" ADD COLUMN "theme_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "themes" ADD CONSTRAINT "themes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "themes_created_by_idx" ON "themes" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "themes_visibility_idx" ON "themes" USING btree ("visibility");--> statement-breakpoint
ALTER TABLE "form_versions" ADD CONSTRAINT "form_versions_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "form_versions_theme_id_idx" ON "form_versions" USING btree ("theme_id");