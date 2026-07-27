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
  return results.map(({ functionDegree, romanNumeral, impliedTonicName, impliedTonicPitchClass }) => ({
    functionDegree,
    romanNumeral,
    impliedTonicName,
    impliedTonicPitchClass,
  }));
}

test("dominant quality produces V only", () => {
  assert.deepEqual(summary(interpretations("A7#5#9", "A", 9, "7#5#9")), [
    { functionDegree: 5, romanNumeral: "V", impliedTonicName: "D", impliedTonicPitchClass: 2 },
  ]);
  assert.equal(
    interpretations("A7#5#9", "A", 9, "7#5#9")[0].explanation,
    "A7#5#9 interpreted as V of D",
  );
});

test("major triads produce I, IV, and V interpretations", () => {
  const results = interpretations("A", "A", 9, "");
  assert.deepEqual(summary(results), [
    { functionDegree: 1, romanNumeral: "I", impliedTonicName: "A", impliedTonicPitchClass: 9 },
    { functionDegree: 4, romanNumeral: "IV", impliedTonicName: "E", impliedTonicPitchClass: 4 },
    { functionDegree: 5, romanNumeral: "V", impliedTonicName: "D", impliedTonicPitchClass: 2 },
  ]);
  assert.deepEqual(results.map(result => result.explanation), [
    "A interpreted as I of A",
    "A interpreted as IV of E",
    "A interpreted as V of D",
  ]);
});

test("major-seventh family produces I and IV only", () => {
  const results = interpretations("Fmaj9", "F", 5, "maj9");
  assert.deepEqual(summary(results), [
    { functionDegree: 1, romanNumeral: "I", impliedTonicName: "F", impliedTonicPitchClass: 5 },
    { functionDegree: 4, romanNumeral: "IV", impliedTonicName: "C", impliedTonicPitchClass: 0 },
  ]);
  assert.equal(results[1].explanation, "Fmaj9 interpreted as IV of C");
});

test("minor family produces ii, iii, and vi interpretations", () => {
  const results = interpretations("Am9", "A", 9, "m9");
  assert.deepEqual(summary(results), [
    { functionDegree: 2, romanNumeral: "ii", impliedTonicName: "G", impliedTonicPitchClass: 7 },
    { functionDegree: 3, romanNumeral: "iii", impliedTonicName: "F", impliedTonicPitchClass: 5 },
    { functionDegree: 6, romanNumeral: "vi", impliedTonicName: "C", impliedTonicPitchClass: 0 },
  ]);
  assert.deepEqual(results.map(result => result.explanation), [
    "Am9 interpreted as ii of G",
    "Am9 interpreted as iii of F",
    "Am9 interpreted as vi of C",
  ]);
});

test("diminished and half-diminished roots produce vii only", () => {
  const diminished = interpretations("Bdim", "B", 11, "dim")[0];
  const halfDiminished = interpretations("Bm7b5", "B", 11, "m7b5")[0];

  assert.equal(diminished.romanNumeral, "vii°");
  assert.equal(diminished.explanation, "Bdim interpreted as vii° of C");
  assert.equal(halfDiminished.romanNumeral, "viiø7");
  assert.equal(halfDiminished.explanation, "Bm7b5 interpreted as viiø7 of C");
});

test("recognized qualities without standard functions use their root as a reference", () => {
  for (const [name, root, pitchClass, quality] of [
    ["CmMaj7", "C", 0, "mMaj7"],
    ["CmMaj9", "C", 0, "mMaj9"],
    ["FmMaj11", "F", 5, "mMaj11"],
    ["BbmMaj11", "Bb", 10, "mMaj11"],
    ["CmMaj13", "C", 0, "mMaj13"],
    ["CminMaj7", "C", 0, "minMaj7"],
    ["CminMaj9", "C", 0, "minMaj9"],
    ["CminMaj11", "C", 0, "minMaj11"],
    ["CminMaj13", "C", 0, "minMaj13"],
    ["Caug", "C", 0, "aug"],
    ["Csus4", "C", 0, "sus4"],
    ["C(9,3,♭13)", "C", 0, "(9,3,♭13)"],
  ]) {
    const results = interpretations(name, root, pitchClass, quality);
    assert.equal(results.length, 1);
    assert.deepEqual(results[0], {
      interpretationType: "root-reference",
      sourceChordName: name,
      sourceChordRoot: root,
      sourceQuality: "other",
      functionDegree: null,
      romanNumeral: null,
      impliedTonicName: root,
      impliedTonicPitchClass: pitchClass,
      explanation: `${name} referenced to ${root}`,
    });
  }
});

test("root-reference fallback uses the chord root before a slash", () => {
  const results = interpretations("CmMaj7/G", "C", 0, "mMaj7");
  assert.equal(results.length, 1);
  assert.equal(results[0].impliedTonicName, "C");
  assert.equal(results[0].impliedTonicPitchClass, 0);
  assert.equal(results[0].explanation, "CmMaj7/G referenced to C");
});

test("unrecognized analyses do not receive a fallback tonic", () => {
  assert.deepEqual(interpretations("Custom Voicing", "", 0, ""), []);
  assert.deepEqual(interpretations("Unknown", "", 5, ""), []);
  assert.deepEqual(interpretations("", "F", 5, ""), []);
});

test("interpretations preserve analyzed minor casing and accidental spelling", () => {
  const flatResults = interpretations("Bbm7", "Bb", 10, "m7");
  const sharpResults = interpretations("C#m7", "C#", 1, "m7");

  assert.equal(flatResults[0].sourceChordName, "Bbm7");
  assert.equal(flatResults[0].sourceChordRoot, "Bb");
  assert.equal(flatResults[0].sourceQuality, "minor");
  assert.equal(flatResults[0].explanation, "Bbm7 interpreted as ii of Ab");
  assert.equal(sharpResults[0].sourceChordName, "C#m7");
  assert.ok(sharpResults.every(result => !/[A-Z]M7/.test(result.explanation)));
});

test("each interpretation produces its own ordered, octave-preserving transformation", () => {
  const original = [57, 64, 65, 67, 72];
  const snapshot = original.slice();
  const results = interpretations("Fmaj9", "F", 5, "maj9").map(item => ({
    romanNumeral: item.romanNumeral,
    notes: tonicNegativeHarmony(original, item.impliedTonicPitchClass),
  }));

  assert.deepEqual(results, [
    { romanNumeral: "I", notes: [56, 61, 60, 70, 77] },
    { romanNumeral: "IV", notes: [58, 63, 62, 72, 67] },
  ]);
  assert.equal(results[0].notes.length, original.length);
  assert.equal(results[1].notes.length, original.length);
  assert.deepEqual(original, snapshot);
});
