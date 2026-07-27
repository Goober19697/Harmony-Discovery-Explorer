import test from "node:test";
import assert from "node:assert/strict";

import { chordRootFromName } from "../src/chordRoot.js";
import { tonicNegativeHarmony } from "../src/fixedTonicNegativeHarmony.js";

test("chord roots are extracted with common suffixes and accidentals", () => {
  assert.deepEqual(chordRootFromName("Fmaj9"), { name: "F", pitchClass: 5 });
  assert.deepEqual(chordRootFromName("Cmaj9"), { name: "C", pitchClass: 0 });
  assert.deepEqual(chordRootFromName("C#m7"), { name: "C#", pitchClass: 1 });
  assert.deepEqual(chordRootFromName("Dbmaj9"), { name: "Db", pitchClass: 1 });
  assert.deepEqual(chordRootFromName("Ebmin11"), { name: "Eb", pitchClass: 3 });
  assert.deepEqual(chordRootFromName("F♯m7b5"), { name: "F♯", pitchClass: 6 });
  assert.deepEqual(chordRootFromName("B♭13"), { name: "B♭", pitchClass: 10 });
  assert.deepEqual(chordRootFromName("C#maj7#5"), { name: "C#", pitchClass: 1 });
  assert.deepEqual(chordRootFromName("Dbmaj9#5"), { name: "Db", pitchClass: 1 });
  assert.deepEqual(chordRootFromName("Abmaj11#5"), { name: "Ab", pitchClass: 8 });
  assert.deepEqual(chordRootFromName("Fmaj13#5"), { name: "F", pitchClass: 5 });
});

test("slash chords use the chord root rather than the bass note", () => {
  assert.deepEqual(chordRootFromName("Bbm9/F"), { name: "Bb", pitchClass: 10 });
});

test("unrecognized chord labels do not produce a fallback root", () => {
  for (const label of ["", "Custom Voicing", "Unknown", "No chord", "Hmaj7", "Caution"]) {
    assert.equal(chordRootFromName(label), null);
  }
});

test("the documented Fmaj9 regression derives F and preserves the displayed voices", () => {
  const root = chordRootFromName("Fmaj9");
  const original = [57, 64, 65, 67, 72];
  const snapshot = original.slice();
  const transformed = tonicNegativeHarmony(original, root.pitchClass);

  assert.deepEqual(transformed, [56, 61, 60, 70, 77]);
  assert.deepEqual(original, snapshot);
});
