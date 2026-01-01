CREATE TABLE "platform_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_platform_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "platform_member_roles" (
	"member_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"assigned_at" timestamp DEFAULT now(),
	CONSTRAINT "platform_member_roles_member_id_role_id_pk" PRIMARY KEY("member_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "platform_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_platform_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"username" text NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"is_bot" boolean DEFAULT false,
	"joined_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "platform_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_platform_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"position" integer DEFAULT 0,
	"permissions" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DROP TABLE "test_realtime" CASCADE;--> statement-breakpoint
ALTER TABLE "platform_channels" ADD CONSTRAINT "platform_channels_game_platform_id_game_platforms_id_fk" FOREIGN KEY ("game_platform_id") REFERENCES "public"."game_platforms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_member_roles" ADD CONSTRAINT "platform_member_roles_member_id_platform_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."platform_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_member_roles" ADD CONSTRAINT "platform_member_roles_role_id_platform_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."platform_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_members" ADD CONSTRAINT "platform_members_game_platform_id_game_platforms_id_fk" FOREIGN KEY ("game_platform_id") REFERENCES "public"."game_platforms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_roles" ADD CONSTRAINT "platform_roles_game_platform_id_game_platforms_id_fk" FOREIGN KEY ("game_platform_id") REFERENCES "public"."game_platforms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_channel_per_connection" ON "platform_channels" USING btree ("game_platform_id","external_id");--> statement-breakpoint
CREATE INDEX "platform_channels_gp_idx" ON "platform_channels" USING btree ("game_platform_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_member_per_connection" ON "platform_members" USING btree ("game_platform_id","external_id");--> statement-breakpoint
CREATE INDEX "platform_members_gp_idx" ON "platform_members" USING btree ("game_platform_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_role_per_connection" ON "platform_roles" USING btree ("game_platform_id","external_id");--> statement-breakpoint
CREATE INDEX "platform_roles_gp_idx" ON "platform_roles" USING btree ("game_platform_id");