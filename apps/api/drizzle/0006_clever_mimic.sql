ALTER TABLE "game_onboarding_progress" ADD COLUMN "total_items" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "game_onboarding_progress" ADD COLUMN "processed_items" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "game_onboarding_progress" ADD COLUMN "failed_items" integer DEFAULT 0;