import test from "node:test";
import assert from "node:assert/strict";

import {
  negativeHarmony,
  negativeHarmonyLabel,
  negativeHarmonySourceDescription,
  negativeHarmonyUsesFlats,
  normalizeShadowVoicing,
  shadowVoicing,
  shadowVoicingSourceDescription,
} from "../src/negativeHarmony.js";
import { chordLabel } from "../src/chordPatterns.js";

test("negative harmony reflects intervals around the first note", () => {
  assert.deepEqual(negativeHarmony([57, 60, 64]), [50, 54, 57]);
});

test("the pivot remains present while the shadow is ordered from its new root", () => {
  assert.deepEqual(negativeHarmony([60, 64, 67, 72]), [48, 53, 56, 60]);
});

test("the reflected voicing is named from its new root", () => {
  assert.equal(chordLabel(negativeHarmony([57, 60, 64])), "D");
});

test("an inverted shadow is named from its harmonic root with conventional spelling", () => {
  const shadow = negativeHarmony([46, 50, 53, 58]);
  assert.deepEqual(shadow, [34, 39, 42, 46]);
  assert.equal(negativeHarmonyLabel(shadow), "E♭m");
  assert.equal(negativeHarmonyUsesFlats(shadow), true);
});

test("a shadow can be named as a supported chord with an unplayed root", () => {
  assert.equal(negativeHarmonyLabel([47, 49, 56]), "Amaj9 (rootless)");
});

test("a major-nine sharp-eleven shadow preserves its conventional quality", () => {
  const source = [53, 57, 60, 64, 67, 71];
  assert.equal(negativeHarmonyLabel(negativeHarmony(source)), "Bmaj9#11");
});

test("an unrecognized shadow still displays intervals from its lowest note", () => {
  assert.equal(negativeHarmonyLabel([60, 61, 62]), "C(♭9,9)");
});

test("an empty voicing has no negative harmony", () => {
  assert.deepEqual(negativeHarmony([]), []);
});

test("register normalization leaves an already musical voicing at or above F2 unchanged", () => {
  assert.deepEqual(normalizeShadowVoicing([53, 57, 60]), [53, 57, 60]);
});

test("F2 is accepted as the unchanged lowest Shadow note", () => {
  assert.deepEqual(normalizeShadowVoicing([41, 48, 55]), [41, 48, 55]);
});

test("register normalization raises one sub-F2 pitch by octaves", () => {
  assert.deepEqual(normalizeShadowVoicing([40, 48, 55]), [52, 60, 67]);
});

test("register normalization handles several sub-F2 pitches", () => {
  const normalized = normalizeShadowVoicing([24, 31, 34, 39, 41]);
  assert.deepEqual(normalized, [48, 55, 58, 63, 65]);
});

test("very low raw voicings are normalized deterministically", () => {
  const raw = [12, 19, 22, 27, 29];
  assert.deepEqual(normalizeShadowVoicing(raw), [48, 55, 58, 63, 65]);
  assert.deepEqual(normalizeShadowVoicing(raw), normalizeShadowVoicing(raw));
});

test("duplicate pitch classes in different octaves preserve both voices", () => {
  const raw = [41, 53, 60, 64];
  const normalized = normalizeShadowVoicing(raw);
  assert.deepEqual(normalized, [41, 53, 60, 64]);
  assert.equal(normalized.filter(midi => midi % 12 === 5).length, 2);
});

test("five-note and six-note extended shadows retain every voice above the floor", () => {
  for (const raw of [
    [20, 24, 27, 31, 34],
    [15, 19, 22, 25, 29, 32],
  ]) {
    const normalized = normalizeShadowVoicing(raw);
    assert.equal(normalized.length, raw.length);
    assert.ok(normalized.every(midi => midi >= 41));
  }
});

test("normalization preserves the pitch-class multiset and voice count", () => {
  const raw = [24, 31, 34, 36, 39, 41];
  const normalized = normalizeShadowVoicing(raw);
  const pitchClasses = notes => notes.map(midi => ((midi % 12) + 12) % 12).sort((a, b) => a - b);

  assert.equal(normalized.length, raw.length);
  assert.deepEqual(pitchClasses(normalized), pitchClasses(raw));
  assert.ok(normalized.every(midi => midi >= 41));
  assert.deepEqual(normalized, normalized.slice().sort((a, b) => a - b));
});

test("Shadow Voicing mirrors first, then normalizes without changing the raw transform", () => {
  const source = [46, 50, 53, 58];
  assert.deepEqual(negativeHarmony(source), [34, 39, 42, 46]);
  assert.deepEqual(shadowVoicing(source), normalizeShadowVoicing([34, 39, 42, 46]));
  assert.ok(shadowVoicing(source).every(midi => midi >= 41));
});

test("negative harmony save context identifies its source chord or source notes", () => {
  assert.equal(
    negativeHarmonySourceDescription("Fmaj9", [53, 57, 60, 64, 67], true),
    "Negative harmony of Fmaj9"
  );
  assert.equal(
    negativeHarmonySourceDescription("Custom voicing", [53, 57, 60, 64, 67], true),
    "Negative harmony of F3 A3 C4 E4 G4"
  );
});

test("shadow voicing save context remains distinct from Negative Harmony", () => {
  assert.equal(
    shadowVoicingSourceDescription("Fmaj9", [53, 57, 60, 64, 67], true),
    "Shadow Voicing of Fmaj9"
  );
  assert.equal(
    shadowVoicingSourceDescription("Custom voicing", [53, 57, 60, 64, 67], true),
    "Shadow Voicing of F3 A3 C4 E4 G4"
  );
});
