/**
 * Loads .env files into process.env for the server side.
 *
 * Vite only exposes `VITE_`-prefixed variables to the client bundle and never
 * populates process.env, so without this the API would silently ignore every
 * mail and deployment setting placed in .env.local.
 *
 * Import this first — before anything that reads process.env at module load
 * time (db.ts resolves CMS_DATA_DIR on import).
 *
 * Precedence: variables already in the real environment win, then .env.local,
 * then .env. dotenv never overwrites a key that is already set.
 */
import { config } from "dotenv";

config({ path: [".env.local", ".env"], quiet: true });

export {};
