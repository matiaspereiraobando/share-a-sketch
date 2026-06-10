import { CANVAS_HEIGHT, CANVAS_WIDTH, MAX_POINTS, STROKE_WIDTHS } from "@/lib/constants";
import { getPalette, PALETTES } from "@/lib/palettes";
import type { StoredStroke } from "@/lib/db/schema";

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export type SubmitDrawingPayload = {
  paletteId: string;
  authorName: string;
  strokes: StoredStroke[];
  pointCount: number;
  usedPrompt: boolean;
};

const MAX_NAME_LENGTH = 24;
const MAX_STROKES = 1024;

function isInt(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n);
}

export function validateSubmitDrawing(
  input: unknown,
): ValidationResult<SubmitDrawingPayload> {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "Invalid payload" };
  }
  const obj = input as Record<string, unknown>;

  const paletteId = typeof obj.paletteId === "string" ? obj.paletteId : "";
  if (!PALETTES.some((p) => p.id === paletteId)) {
    return { ok: false, error: "Unknown palette" };
  }
  const palette = getPalette(paletteId);

  let authorName =
    typeof obj.authorName === "string" ? obj.authorName.trim() : "";
  if (authorName.length > MAX_NAME_LENGTH) {
    authorName = authorName.slice(0, MAX_NAME_LENGTH);
  }
  if (!authorName) {
    authorName = generateAnonName();
  }

  if (!Array.isArray(obj.strokes)) {
    return { ok: false, error: "Strokes must be an array" };
  }
  const rawStrokes = obj.strokes;
  if (rawStrokes.length === 0) {
    return { ok: false, error: "Sketch is empty" };
  }
  if (rawStrokes.length > MAX_STROKES) {
    return { ok: false, error: "Too many strokes" };
  }

  const strokes: StoredStroke[] = [];
  let totalPoints = 0;

  for (let i = 0; i < rawStrokes.length; i++) {
    const s = rawStrokes[i] as Record<string, unknown> | null;
    if (!s || typeof s !== "object") {
      return { ok: false, error: `Stroke ${i} is invalid` };
    }
    if (
      !isInt(s.c) ||
      s.c < 0 ||
      s.c >= palette.colors.length
    ) {
      return { ok: false, error: `Stroke ${i}: invalid color index` };
    }
    if (!isInt(s.w) || s.w < 0 || s.w >= STROKE_WIDTHS.length) {
      return { ok: false, error: `Stroke ${i}: invalid width index` };
    }
    if (!Array.isArray(s.p) || s.p.length < 2 || s.p.length % 2 !== 0) {
      return { ok: false, error: `Stroke ${i}: invalid points` };
    }
    const p = s.p as unknown[];
    const cleanedPoints: number[] = new Array(p.length);
    for (let j = 0; j < p.length; j++) {
      const v = p[j];
      if (!isInt(v)) {
        return { ok: false, error: `Stroke ${i}: non-integer point` };
      }
      const max = j % 2 === 0 ? CANVAS_WIDTH : CANVAS_HEIGHT;
      if (v < 0 || v > max) {
        return { ok: false, error: `Stroke ${i}: point out of bounds` };
      }
      cleanedPoints[j] = v;
    }
    const pairs = cleanedPoints.length / 2;
    totalPoints += pairs;
    if (totalPoints > MAX_POINTS) {
      return { ok: false, error: "Sketch exceeds maximum point budget" };
    }
    strokes.push({
      c: s.c,
      w: s.w,
      p: cleanedPoints,
    });
  }

  const usedPrompt = obj.usedPrompt === true;

  return {
    ok: true,
    value: {
      paletteId,
      authorName,
      strokes,
      pointCount: totalPoints,
      usedPrompt,
    },
  };
}

export function generateAnonName(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `Anonymous-${n}`;
}

export type VotePayload = { type: "thumb" | "flag" };

export function validateVote(input: unknown): ValidationResult<VotePayload> {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "Invalid payload" };
  }
  const t = (input as Record<string, unknown>).type;
  if (t !== "thumb" && t !== "flag") {
    return { ok: false, error: "Vote type must be 'thumb' or 'flag'" };
  }
  return { ok: true, value: { type: t } };
}
