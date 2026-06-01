CREATE TABLE `todos` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`due_date` text,
	`completed` integer DEFAULT false NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`tags` text NOT NULL,
	`memo` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `todos_user_id_idx` ON `todos` (`user_id`);--> statement-breakpoint
CREATE INDEX `todos_user_completed_due_idx` ON `todos` (`user_id`,`completed`,`due_date`);--> statement-breakpoint
CREATE TABLE `routine_completions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`routine_id` text,
	`scheduled_date` text NOT NULL,
	`snapshot_title` text NOT NULL,
	`snapshot_time_of_day` text,
	`completed_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`routine_id`) REFERENCES `routines`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `routine_completions_routine_date_uniq` ON `routine_completions` (`routine_id`,`scheduled_date`);--> statement-breakpoint
CREATE INDEX `routine_completions_user_date_idx` ON `routine_completions` (`user_id`,`scheduled_date`);--> statement-breakpoint
CREATE TABLE `routines` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`repetition_type` text NOT NULL,
	`weekdays` text NOT NULL,
	`day_of_month` integer,
	`last_day_of_month` integer DEFAULT false NOT NULL,
	`month_parity` text DEFAULT 'all' NOT NULL,
	`holiday_shift` text DEFAULT 'none' NOT NULL,
	`interval_days` integer,
	`anchor_date` text,
	`time_of_day` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `routines_user_id_idx` ON `routines` (`user_id`);--> statement-breakpoint
CREATE INDEX `routines_user_active_sort_idx` ON `routines` (`user_id`,`is_active`,`sort_order`);--> statement-breakpoint
CREATE TABLE `packing_items` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`set_id` text NOT NULL,
	`label` text NOT NULL,
	`checked` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`set_id`) REFERENCES `packing_sets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `packing_items_set_id_idx` ON `packing_items` (`set_id`);--> statement-breakpoint
CREATE INDEX `packing_items_user_id_idx` ON `packing_items` (`user_id`);--> statement-breakpoint
CREATE INDEX `packing_items_set_sort_idx` ON `packing_items` (`set_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `packing_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`date` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `packing_sets_user_id_idx` ON `packing_sets` (`user_id`);--> statement-breakpoint
CREATE INDEX `packing_sets_user_archived_date_idx` ON `packing_sets` (`user_id`,`is_archived`,`date`);