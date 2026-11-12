-- Позиция заказа хранит снимок файла модели. Существующие позиции получают
-- ключ из своей детали; у позиций с уже удаленной деталью он остается пустым.
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "file_key" text;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "file_name" varchar(255);--> statement-breakpoint
UPDATE "order_items" SET "file_key" = "parts"."file_key", "file_name" = "parts"."file_name" FROM "parts" WHERE "order_items"."part_id" = "parts"."id" AND "order_items"."file_key" IS NULL;--> statement-breakpoint
UPDATE "order_items" SET "file_key" = COALESCE("file_key", ''), "file_name" = COALESCE("file_name", '') WHERE "file_key" IS NULL OR "file_name" IS NULL;--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "file_key" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "file_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "parts" ADD COLUMN IF NOT EXISTS "volume_cm3" real;
