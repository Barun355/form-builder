CREATE TYPE "public"."form_visibility" AS ENUM('PUBLIC', 'UNLISTED');--> statement-breakpoint
ALTER TABLE "forms" ADD COLUMN "visibility" "form_visibility" DEFAULT 'UNLISTED' NOT NULL;