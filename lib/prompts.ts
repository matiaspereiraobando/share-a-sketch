import { PROMPT_ROTATION_DAYS } from "@/lib/constants";

/**
 * Hardcoded prompt catalog. Rotates in order by UTC date so every visitor
 * sees the same prompt on the same day and the cycle is deterministic
 * (no DB state needed). When the list ends we loop back to the first.
 *
 * Keep the order stable: stored sketches reference the prompt as text,
 * so reordering does not retroactively change anything, but inserting a
 * prompt mid-list will shift which day the later prompts land on.
 */
export const PROMPTS: readonly string[] = [
  "A cat plotting world domination",
  "Your computer, but it has feelings",
  "A dinosaur using a smartphone",
  "The world's worst superhero",
  "A snail in a hurry",
  "A haunted house party",
  "A robot learning to dance",
  "Breakfast, but make it terrifying",
  "A duck running for president",
  "The last slice of pizza",
  "A spaceship powered by spite",
  "A very smug frog",
  "A tree having a great hair day",
  "A ghost who got lost",
  "Two snowmen in love",
  "A grumpy cloud",
  "A skateboarding grandma",
  "The inside of a black hole",
  "A penguin on vacation",
  "A monster under the bed (introduce yourself)",
  "A flower that bites",
  "A wizard who lost his hat",
  "A traffic jam in space",
  "A sandwich with too many layers",
  "A confused robot at a bus stop",
  "A dragon who's afraid of fire",
  "The moon, but it's cheese (prove it)",
  "A bird wearing a tiny hat",
  "A potato living its best life",
  "Whatever this is supposed to be",
] as const;

const MS_PER_DAY = 86_400_000;

/**
 * Index into `PROMPTS` for the given moment, rotating every
 * `PROMPT_ROTATION_DAYS` days and wrapping at the end of the list.
 * Uses UTC so the prompt flips at the same instant for everyone.
 */
export function getCurrentPromptIndex(now: number = Date.now()): number {
  const period = Math.max(1, PROMPT_ROTATION_DAYS) * MS_PER_DAY;
  const slot = Math.floor(now / period);
  return ((slot % PROMPTS.length) + PROMPTS.length) % PROMPTS.length;
}

/**
 * The active prompt string for the given moment. Server stamps this onto
 * a sketch (when the player opts in) so we never trust client-sent text.
 */
export function getCurrentPrompt(now: number = Date.now()): string {
  return PROMPTS[getCurrentPromptIndex(now)];
}
