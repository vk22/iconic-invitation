CREATE TABLE IF NOT EXISTS "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slot_id" uuid NOT NULL,
	"company" text NOT NULL,
	"guest_count" integer NOT NULL,
	"manage_token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"consent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"capacity" integer DEFAULT 15 NOT NULL,
	"booked_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_slots_date_start_unique" UNIQUE("event_date","start_time"),
	CONSTRAINT "booked_count_non_negative" CHECK ("event_slots"."booked_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_slot_id_event_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."event_slots"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "registrations" ADD CONSTRAINT "registrations_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "bookings_manage_token_unique" ON "bookings" USING btree ("manage_token");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "registrations_phone_confirmed_unique" ON "registrations" USING btree ("phone") WHERE "registrations"."status" = 'confirmed';