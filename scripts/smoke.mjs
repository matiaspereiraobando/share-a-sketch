#!/usr/bin/env node
/**
 * End-to-end smoke test for Share-a-Sketch.
 *
 * Hits a running server (default http://localhost:3000) and exercises:
 *   1. POST /api/drawings (anon A) -> 403/empty next OK
 *   2. POST /api/drawings (anon B) -> next sketch returned (the A one)
 *   3. GET /api/drawings/random (anon B) -> returns something
 *   4. GET /api/drawings/:id -> returns the sketch
 *   5. POST /api/drawings/:id/vote thumb (anon B) -> 1 thumbs up
 *   6. POST /api/drawings/:id/vote thumb (anon B) again -> alreadyVoted: true
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 node scripts/smoke.mjs
 */
import { randomUUID } from "node:crypto";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

function makeAnon() {
  return randomUUID();
}

async function req(method, path, anonId, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      "x-anon-id": anonId,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {}
  return { status: res.status, data };
}

function sampleStrokes() {
  return [
    { c: 0, w: 1, p: [10, 10, 50, 50, 100, 30] },
    { c: 1, w: 0, p: [20, 80, 80, 80] },
  ];
}

function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exitCode = 1;
    throw new Error(msg);
  }
  console.log(`OK  : ${msg}`);
}

async function main() {
  const a = makeAnon();
  const b = makeAnon();

  console.log("\n-- 1. anon A submits a sketch --");
  const aSubmit = await req("POST", "/api/drawings", a, {
    paletteId: "classic",
    authorName: "Smoketester-A",
    strokes: sampleStrokes(),
    pointCount: 5,
  });
  assert(aSubmit.status === 200, `A submit: ${aSubmit.status} ${JSON.stringify(aSubmit.data)}`);
  assert(typeof aSubmit.data.saved.id === "string", "A submit returns saved.id");
  const idA = aSubmit.data.saved.id;

  console.log("\n-- 2. anon B submits a sketch (should get A as next) --");
  const bSubmit = await req("POST", "/api/drawings", b, {
    paletteId: "classic",
    authorName: "",
    strokes: sampleStrokes(),
    pointCount: 5,
  });
  assert(bSubmit.status === 200, `B submit: ${bSubmit.status}`);
  assert(bSubmit.data.next !== null, "B submit returns a next drawing (likely A or another existing)");

  console.log("\n-- 3. anon B fetches another random --");
  const random = await req("GET", "/api/drawings/random", b);
  assert(random.status === 200, `random: ${random.status}`);
  assert(random.data.drawing !== null, "random returns a drawing");

  console.log("\n-- 4. fetch drawing A by id --");
  const byId = await req("GET", `/api/drawings/${idA}`, b);
  assert(byId.status === 200, `by id: ${byId.status}`);
  assert(byId.data.drawing.id === idA, "by id matches");

  console.log("\n-- 5. anon B thumbs up A --");
  const v1 = await req("POST", `/api/drawings/${idA}/vote`, b, { type: "thumb" });
  assert(v1.status === 200, `vote: ${v1.status}`);
  assert(v1.data.alreadyVoted === false, "first vote is not dedupe");
  assert(v1.data.thumbsUp >= 1, "thumbs up incremented");

  console.log("\n-- 6. anon B tries to thumb again -> dedupe --");
  const v2 = await req("POST", `/api/drawings/${idA}/vote`, b, { type: "thumb" });
  assert(v2.status === 200, `vote2: ${v2.status}`);
  assert(v2.data.alreadyVoted === true, "second vote is dedupe");

  console.log("\nAll smoke checks passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
