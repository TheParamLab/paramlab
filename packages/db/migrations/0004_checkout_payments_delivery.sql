CREATE TABLE IF NOT EXISTS "delivery_points" (
	"id" text PRIMARY KEY NOT NULL,
	"shipment_method_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"name" varchar(255),
	"type" varchar(80),
	"city" varchar(120),
	"region" varchar(120),
	"address" text NOT NULL,
	"postal_code" varchar(20),
	"latitude" real,
	"longitude" real,
	"max_weight_grams" integer,
	"max_length_mm" integer,
	"max_width_mm" integer,
	"max_height_mm" integer,
	"active" boolean DEFAULT true NOT NULL,
	"raw" jsonb,
	"synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"payment_id" text NOT NULL,
	"event" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_rub" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payable_rub" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_method" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_point_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_point_name" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_point_address" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_city" varchar(120);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "recipient_phone" varchar(16);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "recipient_name" varchar(120);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_eta_days" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_provider" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_url" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "paid_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "ozon_order_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "ozon_posting_number" text;--> statement-breakpoint
-- Для заказов, оформленных до появления доставки, оплате подлежала только печать.
UPDATE "orders" SET "payable_rub" = "total_rub" WHERE "payable_rub" = 0;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "delivery_points_city_idx" ON "delivery_points" USING btree ("city");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "delivery_points_active_idx" ON "delivery_points" USING btree ("active");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "payment_events_provider_payment_event_idx" ON "payment_events" USING btree ("provider","payment_id","event");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_payment_id_idx" ON "orders" USING btree ("payment_id");