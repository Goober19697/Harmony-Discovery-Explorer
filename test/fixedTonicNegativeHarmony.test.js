import test from "node:test";
import assert from "node:assert/strict";

import { negativeHarmony } from "../src/negativeHarmony.js";
import { analyzeVoicing, chordLabel } from "../src/chordPatterns.js";
import {
  NEGATIVE_HARMONY_TONIC_PC,
  fixedTonicNegativeHarmony,
  nearestMidiForPitchClass,
  negativeHarmonyPitchClass,
} from "../src/fixedTonicNegativeHarmony.js";

test("fixed F-tonic pitch-class mapping follows the Levy formula", () => {
  assert.equal(NEGATIVE_HARMONY_TONIC_PC, 5);
  assert.equal(negativeHarmonyPitchClass(9), 8); // A -> Ab
  assert.equal(negativeHarmonyPitchClass(4), 1); // E -> Db
  assert.equal(negativeHarmonyPitchClass(5), 0); // F -> C
  assert.equal(negativeHarmonyPitchClass(7), 10); // G -> Bb
  assert.equal(negativeHarmonyPitchClass(0), 5); // C -> F
});

test("nearest-octave assignment is deterministic and resolves tritone ties downward", () => {
  assert.equal(nearestMidiForPitchClass(60, 6), 54);
  assert.equal(nearestMidiForPitchClass(60, 5), 65);
});

test("the transformation preserves voice sequence and one output per input voice", () => {
  const original = [57, 64, 65, 67, 72];
  const transformed = fixedTonicNegativeHarmony(original);

  assert.deepEqual(transformed, [56, 61, 60, 70, 77]);
  assert.equal(transformed.length, original.length);
});

test("the transformation does not mutate the original voicing", () => {
  const original = [57, 64, 65, 67, 72];
  const snapshot = original.slice();

  fixedTonicNegativeHarmony(original);

  assert.deepEqual(original, snapshot);
});

test("fixed-tonic Negative Harmony remains independent from Shadow Voicing", () => {
  const original = [57, 64, 65, 67, 72];

  assert.notDeepEqual(fixedTonicNegativeHarmony(original), negativeHarmony(original));
});

test("transformed notes can use the existing chord-name and interval-quality analyzer", () => {
  const transformed = fixedTonicNegativeHarmony([57, 64, 65, 67, 72]);
  const analysis = analyzeVoicing(transformed);

  assert.equal(chordLabel(transformed), "A#m9");
  assert.equal(analysis.suffix, "m9");
});
