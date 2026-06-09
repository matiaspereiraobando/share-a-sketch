/**
 * Replay speed when watching a stored sketch. Points are advanced using
 * elapsed time so the speed is consistent across devices and frame rates.
 */
export const REPLAY_POINTS_PER_SECOND = 300;

/**
 * Hard cap on the total number of points across all strokes in a single
 * sketch. Enforced client-side (stroke is auto-ended and progress bar maxes
 * out) and server-side (oversized payloads are rejected).
 */
export const MAX_POINTS = 4000;

/**
 * Number of flags a sketch must receive before it is soft-hidden from the
 * random pool. Soft-hidden sketches stay in the DB so moderation is
 * reversible.
 */
export const FLAG_THRESHOLD = 3;

/**
 * Minimum number of milliseconds between submissions from the same anon id.
 * Lightweight rate-limit to discourage spam.
 */
export const SUBMIT_COOLDOWN_MS = 3000;

/**
 * Logical canvas size in pixels. The CSS size can be larger via pixelated
 * scaling; coordinates are always stored in this logical space.
 */
export const CANVAS_WIDTH = 320;
export const CANVAS_HEIGHT = 240;

/**
 * Stroke widths offered in the toolbar. Index into this array is what gets
 * stored in each stroke.
 */
export const STROKE_WIDTHS = [2, 5, 9] as const;

/**
 * Alpha applied per stroke for the color-mixing effect. Each stroke is
 * rendered as one continuous path with this alpha so overlap within the
 * same stroke does not produce darkened blobs.
 */
export const STROKE_ALPHA = 0.6;
