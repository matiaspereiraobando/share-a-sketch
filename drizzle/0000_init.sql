CREATE TYPE "public"."drawing_status" AS ENUM('active', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."vote_type" AS ENUM('thumb', 'flag');--> statement-breakpoint
CREATE TABLE "drawings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"palette_id" text NOT NULL,
	"author_name" text NOT NULL,
	"point_count" integer NOT NULL,
	"strokes" jsonb NOT NULL,
	"thumbs_up" integer DEFAULT 0 NOT NULL,
	"flag_count" integer DEFAULT 0 NOT NULL,
	"status" "drawing_status" DEFAULT 'active' NOT NULL,
	"creator_anon_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"drawing_id" uuid NOT NULL,
	"anon_id" text NOT NULL,
	"type" "vote_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_drawing_id_drawings_id_fk" FOREIGN KEY ("drawing_id") REFERENCES "public"."drawings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "drawings_status_created_idx" ON "drawings" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "drawings_creator_idx" ON "drawings" USING btree ("creator_anon_id");--> statement-breakpoint
CREATE UNIQUE INDEX "votes_drawing_anon_unique" ON "votes" USING btree ("drawing_id","anon_id");