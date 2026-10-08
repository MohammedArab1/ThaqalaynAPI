CREATE TABLE "books_v1" (
	"book_id" text PRIMARY KEY NOT NULL,
	"book_name" text NOT NULL,
	"author" text NOT NULL,
	"id_range_min" integer NOT NULL,
	"id_range_max" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "books_v2" (
	"book_id" text PRIMARY KEY NOT NULL,
	"book_name" text NOT NULL,
	"author" text NOT NULL,
	"id_range_min" integer NOT NULL,
	"id_range_max" integer NOT NULL,
	"book_description" text,
	"book_cover" text,
	"english_name" text,
	"translator" text,
	"volume" integer
);
--> statement-breakpoint
CREATE TABLE "hadiths_v1" (
	"book_id" text NOT NULL,
	"id" integer NOT NULL,
	"book" text,
	"category" text,
	"category_id" text,
	"chapter" text,
	"author" text,
	"translator" text,
	"english_text" text,
	"arabic_text" text,
	"majlisi_grading" text,
	"behdudi_grading" text,
	"mohseni_grading" text,
	"url" text
);
--> statement-breakpoint
CREATE TABLE "hadiths_v2" (
	"book_id" text NOT NULL,
	"id" integer NOT NULL,
	"book" text,
	"volume" integer,
	"category" text,
	"category_id" text,
	"chapter" text,
	"author" text,
	"translator" text,
	"english_text" text,
	"arabic_text" text,
	"french_text" text,
	"majlisi_grading" text,
	"behdudi_grading" text,
	"mohseni_grading" text,
	"url" text,
	"chapter_in_category_id" text,
	"thaqalayn_sanad" text,
	"thaqalayn_matn" text,
	"gradings_full" jsonb DEFAULT '[]'::jsonb
);
--> statement-breakpoint
CREATE TABLE "ingredients_v2" (
	"ingredient" text PRIMARY KEY NOT NULL,
	"statuses" text[] DEFAULT '{}' NOT NULL,
	"info" text[],
	"other_names" text[],
	"unknown" text[]
);
--> statement-breakpoint
ALTER TABLE "hadiths_v2" ADD CONSTRAINT "hadiths_v2_book_id_books_v2_book_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books_v2"("book_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_books_v1_book_id" ON "books_v1" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "idx_books_v2_book_id" ON "books_v2" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "idx_hadiths_v1_book_id" ON "hadiths_v1" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "idx_hadiths_v1_book_id_id" ON "hadiths_v1" USING btree ("book_id","id");--> statement-breakpoint
CREATE INDEX "idx_hadiths_v2_book_id" ON "hadiths_v2" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "idx_hadiths_v2_book_id_id" ON "hadiths_v2" USING btree ("book_id","id");--> statement-breakpoint
CREATE INDEX "idx_ingredients_v2_ingredient" ON "ingredients_v2" USING btree ("ingredient");