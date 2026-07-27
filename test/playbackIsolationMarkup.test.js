import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const explorerUrl = new URL("../src/HarmonyDiscoveryExplorer.jsx", import.meta.url);

test("generated suggestions audition only their exact displayed voicing", async () => {
  const source = await readFile(explorerUrl, "utf8");

  assert.match(source, /onClick=\{\(\) => playVoicing\(selectedNotes, r\.key\)\}/);
  assert.doesNotMatch(source, /playTransition/);
  assert.doesNotMatch(source, /playVoicing\(\s*currentNotes\s*,\s*selectedNotes/);
});

test("every single-card playback action passes only that card's notes", async () => {
  const source = await readFile(explorerUrl, "utf8");

  assert.match(source, /playVoicing\(currentNotes, "current"\)/);
  assert.match(source, /playVoicing\(negativeNotes, "negative"\)/);
  assert.match(source, /playVoicing\(result\.notes, `derived-negative-\$\{result\.id\}`\)/);
  assert.match(source, /playVoicing\(notes, "inspect-" \+ inspectedIdx\)/);
});

test("single-voicing playback cancels queued trail audio without changing progression data", async () => {
  const source = await readFile(explorerUrl, "utf8");
  const body = source.match(
    /async function playVoicing\(midis, rowKey\) \{([\s\S]*?)\n  \}\n\n  async function playPianoNote/,
  )?.[1] || "";

  assert.match(body, /stopTrail\(\)/);
  assert.match(body, /triggerAttackRelease\(midis\.map\(freq\)/);
  assert.doesNotMatch(body, /setHistory|setTrailMode|setBpm|currentNotes/);
});

test("only progression playback schedules the history chord sequence with BPM timing", async () => {
  const source = await readFile(explorerUrl, "utf8");
  const body = source.match(
    /async function playProgression\(\) \{([\s\S]*?)\n  \}\n\n  useEffect/,
  )?.[1] || "";

  assert.match(body, /const chords = history/);
  assert.match(body, /const STEP_MS = CHORD_MS/);
  assert.match(body, /chords\.forEach\(\(midis, i\) =>/);
  assert.match(source, /onClick=\{playProgression\}/);
  assert.match(source, /const BEAT_MS = \(60 \/ bpm\) \* 1000/);
  assert.match(source, /onChange=\{e => \{ setBpm\(Number\(e\.target\.value\)\)/);
});
