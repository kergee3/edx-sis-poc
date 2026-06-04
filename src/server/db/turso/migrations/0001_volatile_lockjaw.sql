CREATE TABLE `student_enrollments` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`school_code` text NOT NULL,
	`grade` text NOT NULL,
	`class_code` text,
	`class_name` text,
	`attendance_number` integer,
	`enrollment_status` text NOT NULL,
	`admission_date` integer,
	`transfer_in_date` integer,
	`transfer_out_date` integer,
	`graduation_date` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `student_enrollments_student_idx` ON `student_enrollments` (`student_id`);--> statement-breakpoint
CREATE TABLE `students` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`user_master_identifier` text NOT NULL,
	`official_family_name` text NOT NULL,
	`official_given_name` text NOT NULL,
	`preferred_family_name` text NOT NULL,
	`preferred_given_name` text NOT NULL,
	`preferred_middle_name` text,
	`kana_family_name` text NOT NULL,
	`kana_given_name` text NOT NULL,
	`kana_middle_name` text,
	`birth_date` integer NOT NULL,
	`sex` text,
	`nationality` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `students_owner_idx` ON `students` (`owner_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `students_user_master_identifier_uq` ON `students` (`user_master_identifier`);