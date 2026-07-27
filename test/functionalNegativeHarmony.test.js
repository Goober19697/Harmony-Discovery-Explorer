import test from "node:test";
import assert from "node:assert/strict";

import { functionalNegativeHarmonyInterpretations } from "../src/functionalNegativeHarmony.js";
import { tonicNegativeHarmony } from "../src/fixedTonicNegativeHarmony.js";

function interpretations(sourceChordName, sourceChordRoot, sourceRootPitchClass, quality) {
  return functionalNegativeHarmonyInterpretations({
    sourceChordName,
    sourceChordRoot,
    sourceRootPitchClass,
    quality,
  });
}

function summary(results) {
  return results.map(({ functionLabel, impliedTonicName, impliedTonicPitchClass }) => ({
    functionLabel,
    impliedTonicName,
    impliedTonicPitchClass,
  }));
}

test("dominant quality produces V only", () => {
  assert.deepEqual(summary(interpretations("A7#5#9", "A", 9, "7#5#9")), [
    { functionLabel: "V", impliedTonicName: "D", impliedTonicPitchClass: 2 },
  ]);
});

test("major triads produce I, IV, and V interpretations", () => {
  assert.deepEqual(summary(interpretations("F", "F", 5, "")), [
    { functionLabel: "I", impliedTonicName: "F", impliedTonicPitchClass: 5 },
    { functionLabel: "IV", impliedTonicName: "C", impliedTonicPitchClass: 0 },
    { functionLabel: "V", impliedTonicName: "Bb", impliedTonicPitchClass: 10 },
  ]);
});

test("major-seventh family produces I and IV only", () => {
  const results = interpretations("Fmaj9", "F", 5, "maj9");
  assert.deepEqual(summary(results), [
    { functionLabel: "I", impliedTonicName: "F", impliedTonicPitchClass: 5 },
    { functionLabel: "IV", impliedTonicName: "C", impliedTonicPitchClass: 0 },
  ]);
  assert.equal(results[1].explanation, "Fmaj9 interpreted as IV of C");
});

test("minor family produces ii, iii, and vi interpretations", () => {
  assert.deepEqual(summary(interpretations("Dm7", "D", 2, "m7")), [
    { functionLabel: "ii", impliedTonicName: "C", impliedTonicPitchClass: 0 },
    { functionLabel: "iii", impliedTonicName: "Bb", impliedTonicPitchClass: 10 },
    { functionLabel: "vi", impliedTonicName: "F", impliedTonicPitchClass: 5 },
  ]);
});

test("diminished and half-diminished roots produce vii only", () => {
  for (const [name, quality] of [["Bdim", "dim"], ["Bm7b5", "m7b5"]]) {
    assert.deepEqual(summary(interpretations(name, "B", 11, quality)), [
      { functionLabel: "vii", impliedTonicName: "C", impliedTonicPitchClass: 0 },
    ]);
  }
});

test("unsupported qualities do not produce standard interpretations", () => {
  for (const quality of ["m(maj7)", "aug maj7", "aug", "(9,3,♭13)"]) {
    assert.deepEqual(interpretations(`C${quality}`, "C", 0, quality), []);
  }
  assert.deepEqual(interpretations("Custom Voicing", "", 0, ""), []);
});

test("each interpretation produces its own ordered, octave-preserving transformation", () => {
  const original = [57, 64, 65, 67, 72];
  const snapshot = original.slice();
  const results = interpretations("Fmaj9", "F", 5, "maj9").map(item => ({
    functionLabel: item.functionLabel,
    notes: tonicNegativeHarmony(original, item.impliedTonicPitchClass),
  }));

  assert.deepEqual(results, [
    { functionLabel: "I", notes: [56, 61, 60, 70, 77] },
    { functionLabel: "IV", notes: [58, 63, 62, 72, 67] },
  ]);
  assert.equal(results[0].notes.length, original.length);
  assert.equal(results[1].notes.length, original.length);
  assert.deepEqual(original, snapshot);
});
