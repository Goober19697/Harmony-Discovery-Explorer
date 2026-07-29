import test from "node:test";
import assert from "node:assert/strict";

import { negativeHarmony } from "../src/negativeHarmony.js";
import { analyzeVoicing, chordLabel } from "../src/chordPatterns.js";
import {
  nearestMidiForPitchClass,
  negativeHarmonyPitchClass,
  optimizeNegativeHarmonyRegister,
  tonicNegativeHarmony,
} from "../src/fixedTonicNegativeHarmony.js";

test("the supplied tonic pitch class drives the Levy formula", () => {
  assert.equal(negativeHarmonyPitchClass(9, 5), 8); // A -> Ab around F
  assert.equal(negativeHarmonyPitchClass(4, 5), 1); // E -> Db around F
  assert.equal(negativeHarmonyPitchClass(5, 5), 0); // F -> C around F
  assert.equal(negativeHarmonyPitchClass(7, 5), 10); // G -> Bb around F
  assert.equal(negativeHarmonyPitchClass(0, 5), 5); // C -> F around F
  assert.notEqual(negativeHarmonyPitchClass(9, 0), 8);
});

test("nearest-octave assignment is deterministic and resolves tritone ties downward", () => {
  assert.equal(nearestMidiForPitchClass(60, 6), 54);
  assert.equal(nearestMidiForPitchClass(60, 5), 65);
});

test("the transformation preserves voice sequence and one output per input voice", () => {
  const original = [57, 64, 65, 67, 72];
  const transformed = tonicNegativeHarmony(original, 5);

  assert.deepEqual(transformed, [56, 61, 60, 70, 77]);
  assert.equal(transformed.length, original.length);
});

test("the transformation does not mutate the original voicing", () => {
  const original = [57, 64, 65, 67, 72];
  const snapshot = original.slice();

  tonicNegativeHarmony(original, 5);

  assert.deepEqual(original, snapshot);
});

test("derived-tonic Negative Harmony remains independent from Shadow Voicing", () => {
  const original = [57, 64, 65, 67, 72];

  assert.notDeepEqual(tonicNegativeHarmony(original, 5), negativeHarmony(original));
});

test("transformed notes can use the existing chord-name and interval-quality analyzer", () => {
  const transformed = tonicNegativeHarmony([57, 64, 65, 67, 72], 5);
  const analysisNotes = transformed.slice().sort((a, b) => a - b);
  const analysis = analyzeVoicing(analysisNotes);
  const flatNames = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

  assert.equal(chordLabel(analysisNotes, flatNames), "Bbm9");
  assert.equal(analysis.suffix, "m9");
});

test("Negative Harmony has no implicit F fallback", () => {
  const original = [57, 64, 65, 67, 72];

  assert.deepEqual(tonicNegativeHarmony(original), []);
  assert.equal(negativeHarmonyPitchClass(9), null);
});

test("Negative Harmony register optimization preserves pitch classes and voice count", () => {
  const source = [57, 64, 65, 67, 72];
  const raw = tonicNegativeHarmony(source, 5);
  const optimized = optimizeNegativeHarmonyRegister(raw, source);
  const pitchClasses = notes => notes
    .map(midi => ((midi % 12) + 12) % 12)
    .sort((a, b) => a - b);

  assert.equal(optimized.length, raw.length);
  assert.deepEqual(pitchClasses(optimized), pitchClasses(raw));
});

test("Negative Harmony optimization stays near the source register and span", () => {
  const source = [57, 64, 65, 67, 72];
  const raw = tonicNegativeHarmony(source, 5);
  const optimized = optimizeNegativeHarmonyRegister(raw, source);
  const average = notes => notes.reduce((sum, midi) => sum + midi, 0) / notes.length;
  const span = notes => Math.max(...notes) - Math.min(...notes);

  assert.ok(Math.abs(average(optimized) - average(source)) <= 6);
  assert.ok(span(optimized) <= span(source) + 6);
});

test("Negative Harmony optimization avoids an isolated octave-plus gap when compact placement exists", () => {
  const source = [57, 64, 65, 67, 72];
  const optimized = optimizeNegativeHarmonyRegister([32, 49, 60, 70, 89], source);
  const gaps = optimized.slice(1).map((midi, index) => midi - optimized[index]);

  assert.ok(gaps.every(gap => gap <= 12));
});

test("Negative Harmony register optimization is deterministic and has no Shadow F2 floor", () => {
  const source = [28, 33, 36];
  const raw = [23, 28, 32];
  const first = optimizeNegativeHarmonyRegister(raw, source);

  assert.deepEqual(first, optimizeNegativeHarmonyRegister(raw, source));
  assert.ok(first.some(midi => midi < 41));
});
