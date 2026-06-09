import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let cached: NeonHttpDatabase<typeof schema> | null = null;

function createClient(): NeonHttpDatabase<typeof schema> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  const sql = neon(url);
  return drizzle(sql, { schema });
}

/**
 * Lazy-init the Drizzle client. We don't construct it at module evaluation
 * time so production builds without DATABASE_URL (and the build-time page-
 * data collection step) don't crash.
 */
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    if (!cached) cached = createClient();
    const value = Reflect.get(cached, prop, receiver);
    return typeof value === "function" ? value.bind(cached) : value;
  },
});
