CREATE TYPE "public"."form_status" AS ENUM('draft', 'published', 'archived', 'closed');--> statement-breakpoint
CREATE TYPE "public"."form_submission_status" AS ENUM('started', 'completed');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(80) NOT NULL,
	"email" varchar(255) NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"profile_image_url" text,
	"salt" text,
	"password" text,
	"user_global_form_slug" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_user_global_form_slug_unique" UNIQUE("user_global_form_slug")
);
--> statement-breakpoint
CREATE TABLE "forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(55) NOT NULL,
	"description" varchar(255),
	"slug" varchar(255) NOT NULL,
	"created_by" uuid NOT NULL,
	"status" "form_status" DEFAULT 'draft' NOT NULL,
	"published_version_id" uuid,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "forms_created_by_slug_unique" UNIQUE("created_by","slug")
);
--> statement-breakpoint
CREATE TABLE "form_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"status" "form_submission_status" DEFAULT 'started' NOT NULL,
	"form_version_id" uuid NOT NULL,
	"data" jsonb NOT NULL,
	"meta" jsonb,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"submitted_at" timestamp,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "form_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"schema" jsonb NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "form_id_version_unique" UNIQUE("form_id","version")
);
--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_published_version_id_form_versions_id_fk" FOREIGN KEY ("published_version_id") REFERENCES "public"."form_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_form_version_id_form_versions_id_fk" FOREIGN KEY ("form_version_id") REFERENCES "public"."form_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_versions" ADD CONSTRAINT "form_versions_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "forms_created_by_idx" ON "forms" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "forms_published_version_id_idx" ON "forms" USING btree ("published_version_id");--> statement-breakpoint
CREATE INDEX "form_submissions_form_id_idx" ON "form_submissions" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "form_submissions_form_version_id_idx" ON "form_submissions" USING btree ("form_version_id");--> statement-breakpoint
CREATE INDEX "form_versions_form_id_idx" ON "form_versions" USING btree ("form_id");