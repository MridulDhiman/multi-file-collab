import { pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { comments } from "./comments";
import { dependencies } from "./dependencies";
import { files } from "./files";
import { likes } from "./likes";
import { relations } from "drizzle-orm";
import { timestamps } from "../utils/timestamp";
import { users } from "./users";

export const templateTypeEnum = pgEnum("template_type", [
  "static",
  "angular",
  "react",
  "react-ts",
  "solid",
  "svelte",
  "test-ts",
  "vanilla-ts",
  "vanilla",
  "vue",
  "vue-ts",
  "node",
  "nextjs",
  "astro",
  "vite",
  "vite-react",
  "vite-react-ts",
]);

export const modeEnum = pgEnum("mode", ["normal", "collaboration"]);

export const typeEnum = pgEnum("type", ["public", "private", "forked"]);

export const shards = pgTable("shards", {
  id: serial("id").primaryKey(),
  title: text("title").default("Untitled"),
  userId: text("user_id").references(() => users.id, {onDelete: "cascade"}).notNull(),
  templateType: templateTypeEnum().default("react"),
  mode: modeEnum().default("normal"),
  type: typeEnum().default("public"),
  lastSyncTimestamp: timestamp("last_sync_timestamp").defaultNow(),
  ...timestamps,
});


export type ShardTableType = typeof shards;


export const shardsRelations = relations(shards, ({ many }) => ({
  comments: many(comments),
  files: many(files),
  dependencies: many(dependencies),
  likes: many(likes),
}));
