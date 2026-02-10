"use client";

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import debug from "@/lib/debug";
import * as schema from "./schema";

// Singleton instance
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let pglite: PGlite | null = null;

// SQL for creating tables (inline migration)
const createTablesSql = `
  CREATE TABLE IF NOT EXISTS dungeons (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    theme TEXT NOT NULL DEFAULT 'medieval',
    atmosphere TEXT,
    resolution TEXT DEFAULT '1024x1024',
    prompt TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS floors (
    id TEXT PRIMARY KEY,
    dungeon_id TEXT REFERENCES dungeons(id) ON DELETE CASCADE,
    level INTEGER NOT NULL DEFAULT 0,
    name TEXT NOT NULL,
    rendered BOOLEAN DEFAULT FALSE,
    render_url TEXT
  );

  CREATE TABLE IF NOT EXISTS spaces (
    id TEXT PRIMARY KEY,
    floor_id TEXT REFERENCES floors(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    visual_prompt TEXT,
    geometry JSONB,
    lighting TEXT DEFAULT 'dim',
    space_type TEXT DEFAULT 'room',
    floor_type TEXT
  );

  CREATE TABLE IF NOT EXISTS zones (
    id TEXT PRIMARY KEY,
    space_id TEXT REFERENCES spaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    visual_prompt TEXT,
    area JSONB
  );

  CREATE TABLE IF NOT EXISTS connections (
    id TEXT PRIMARY KEY,
    dungeon_id TEXT REFERENCES dungeons(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'door',
    from_space_id TEXT REFERENCES spaces(id),
    from_position JSONB,
    to_space_id TEXT REFERENCES spaces(id),
    to_position JSONB,
    state TEXT DEFAULT 'closed',
    material TEXT
  );

  CREATE TABLE IF NOT EXISTS entities (
    id TEXT PRIMARY KEY,
    dungeon_id TEXT REFERENCES dungeons(id) ON DELETE CASCADE,
    floor_id TEXT REFERENCES floors(id),
    type TEXT NOT NULL DEFAULT 'npc',
    name TEXT NOT NULL,
    description TEXT,
    position JSONB,
    icon TEXT DEFAULT 'person',
    interaction_script TEXT
  );
`;

export async function getDatabase() {
  if (db) return db;

  // Initialize PGLite with IndexedDB persistence
  pglite = new PGlite("idb://dungeon-architect");

  // Run migrations
  await pglite.exec(createTablesSql);

  // Create Drizzle instance
  db = drizzle(pglite, { schema });

  debug.log("[DB] PGLite initialized with Drizzle");

  return db;
}

export async function closeDatabase() {
  if (pglite) {
    await pglite.close();
    pglite = null;
    db = null;
    debug.log("[DB] Database closed");
  }
}

// Re-export schema
export * from "./schema";
