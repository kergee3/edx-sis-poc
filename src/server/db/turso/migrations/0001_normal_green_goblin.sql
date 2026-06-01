CREATE TABLE `account` (
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`providerAccountId` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	PRIMARY KEY(`provider`, `providerAccountId`),
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session` (
	`sessionToken` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text,
	`emailVerified` integer,
	`image` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verificationToken` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL,
	PRIMARY KEY(`identifier`, `token`)
);
--> statement-breakpoint
CREATE TABLE `login_history` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`logged_in_at` integer NOT NULL,
	`provider` text,
	`ip` text,
	`user_agent` text,
	`referer` text,
	`geo_country` text,
	`geo_city` text,
	`geo_region` text,
	`geo_latitude` text,
	`geo_longitude` text,
	`os` text,
	`browser` text,
	`architecture` text,
	`physical_width` integer,
	`physical_height` integer,
	`logical_width` integer,
	`logical_height` integer,
	`hardware_concurrency` integer,
	`device_memory_gb` real,
	`max_touch_points` integer,
	`ua_platform` text,
	`ua_mobile` integer,
	`ua_brands` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `login_history_user_logged_at_idx` ON `login_history` (`user_id`,"logged_in_at" desc);--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`user_id` text PRIMARY KEY NOT NULL,
	`routines_expand_tomorrow` integer DEFAULT true NOT NULL,
	`routines_expand_day_after_tomorrow` integer DEFAULT true NOT NULL,
	`routines_history_retention_days` integer DEFAULT 7 NOT NULL,
	`packing_expand_first_n` integer DEFAULT 3 NOT NULL,
	`packing_show_reset_button` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
