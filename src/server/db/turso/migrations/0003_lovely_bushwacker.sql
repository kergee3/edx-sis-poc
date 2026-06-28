CREATE TABLE `mji_characters` (
	`mj_id` text PRIMARY KEY NOT NULL,
	`corresponding_ucs` text NOT NULL,
	`implemented_ucs` text,
	`ivs` text,
	`svs` text,
	`x0213` text,
	`x0213_unification_serial` text,
	`x0213_unification_class` text,
	`x0212` text,
	`jis_level` integer,
	`total_strokes` integer,
	`readings` text
);
--> statement-breakpoint
CREATE INDEX `mji_characters_corresponding_ucs_idx` ON `mji_characters` (`corresponding_ucs`);--> statement-breakpoint
CREATE INDEX `mji_characters_implemented_ucs_idx` ON `mji_characters` (`implemented_ucs`);--> statement-breakpoint
CREATE INDEX `mji_characters_ivs_idx` ON `mji_characters` (`ivs`);--> statement-breakpoint
CREATE INDEX `mji_characters_x0213_idx` ON `mji_characters` (`x0213`);--> statement-breakpoint
CREATE TABLE `mji_shrink_candidates` (
	`id` text PRIMARY KEY NOT NULL,
	`mj_id` text NOT NULL,
	`criterion` text NOT NULL,
	`priority` integer NOT NULL,
	`target_x0213` text,
	`target_ucs` text,
	`meta` text
);
--> statement-breakpoint
CREATE INDEX `mji_shrink_candidates_mj_id_idx` ON `mji_shrink_candidates` (`mj_id`);--> statement-breakpoint
CREATE INDEX `mji_shrink_candidates_target_ucs_idx` ON `mji_shrink_candidates` (`target_ucs`);