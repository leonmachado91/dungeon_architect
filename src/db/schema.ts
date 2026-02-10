import { pgTable, text, integer, json, timestamp, boolean } from "drizzle-orm/pg-core";
import type { Point, Polygon, ConnectionState, ConnectionType, EntityType, Lighting, Resolution, SpaceType } from "@/types";

// === Dungeons ===

export const dungeons = pgTable("dungeons", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    theme: text("theme").notNull().default("medieval"),
    atmosphere: text("atmosphere"),
    resolution: text("resolution").$type<Resolution>().default("1024x1024"),
    prompt: text("prompt"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// === Floors ===

export const floors = pgTable("floors", {
    id: text("id").primaryKey(),
    dungeonId: text("dungeon_id").references(() => dungeons.id, { onDelete: "cascade" }),
    level: integer("level").notNull().default(0),
    name: text("name").notNull(),
    rendered: boolean("rendered").default(false),
    renderUrl: text("render_url"),
});

// === Spaces ===

export const spaces = pgTable("spaces", {
    id: text("id").primaryKey(),
    floorId: text("floor_id").references(() => floors.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    visualPrompt: text("visual_prompt"),
    geometry: json("geometry").$type<Polygon>(),
    lighting: text("lighting").$type<Lighting>().default("dim"),
    spaceType: text("space_type").$type<SpaceType>().default("room"),
    floorType: text("floor_type"),
});

// === Zones ===

export const zones = pgTable("zones", {
    id: text("id").primaryKey(),
    spaceId: text("space_id").references(() => spaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    visualPrompt: text("visual_prompt"),
    area: json("area").$type<Polygon>(),
});

// === Connections ===

export const connections = pgTable("connections", {
    id: text("id").primaryKey(),
    dungeonId: text("dungeon_id").references(() => dungeons.id, { onDelete: "cascade" }),
    type: text("type").$type<ConnectionType>().notNull().default("door"),
    fromSpaceId: text("from_space_id").references(() => spaces.id),
    fromPosition: json("from_position").$type<Point>(),
    toSpaceId: text("to_space_id").references(() => spaces.id),
    toPosition: json("to_position").$type<Point>(),
    state: text("state").$type<ConnectionState>().default("closed"),
    material: text("material"),
});

// === Entities ===

export const entities = pgTable("entities", {
    id: text("id").primaryKey(),
    dungeonId: text("dungeon_id").references(() => dungeons.id, { onDelete: "cascade" }),
    floorId: text("floor_id").references(() => floors.id),
    type: text("type").$type<EntityType>().notNull().default("npc"),
    name: text("name").notNull(),
    description: text("description"),
    position: json("position").$type<Point>(),
    icon: text("icon").default("person"),
    interactionScript: text("interaction_script"),
});

// Export types for inference
export type Dungeon = typeof dungeons.$inferSelect;
export type NewDungeon = typeof dungeons.$inferInsert;
export type FloorRecord = typeof floors.$inferSelect;
export type NewFloor = typeof floors.$inferInsert;
export type SpaceRecord = typeof spaces.$inferSelect;
export type NewSpace = typeof spaces.$inferInsert;
export type ZoneRecord = typeof zones.$inferSelect;
export type NewZone = typeof zones.$inferInsert;
export type ConnectionRecord = typeof connections.$inferSelect;
export type NewConnection = typeof connections.$inferInsert;
export type EntityRecord = typeof entities.$inferSelect;
export type NewEntity = typeof entities.$inferInsert;
