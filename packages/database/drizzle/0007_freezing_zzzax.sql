ALTER TABLE "forms" ADD COLUMN "theme_id" uuid;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "forms_theme_id_idx" ON "forms" USING btree ("theme_id");