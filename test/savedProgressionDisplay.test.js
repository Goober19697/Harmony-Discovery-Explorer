import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeProgressionTitle,
  replaceSavedProgression,
  savedProgressionMidis,
  savedProgressionDisplaySteps,
  savedVoicingMidis,
} from "../src/savedProgressionDisplay.js";

test("saved progression display preserves one ordered item per stored step", () => {
  const result = savedProgressionDisplaySteps([
    {
      chord_name: "Fmaj9",
      notes: "57 64 65 67 72",
      emotion: "Current Voicing",
    },
    {
      chord_name: "B♭maj9",
      midi_notes: [58, 62, 65, 69, 72],
      emotion: "Negative harmony of Fmaj9",
    },
  ]);

  assert.equal(result.length, 2);
  assert.deepEqual(result.map(step => step.order), [1, 2]);
  assert.equal(result[0].notes, "A3 E4 F4 G4 C5");
  assert.equal(result[1].notes, "B♭3 D4 F4 A4 C5");
  assert.equal(result[1].context, "Negative harmony of Fmaj9");
});

test("saved progression display safely handles missing and legacy fields", () => {
  assert.deepEqual(savedProgressionDisplaySteps([
    { notes: ["A3", "C4", "E4"] },
    { chord_name: "", notes: ["unsupported"], midi_notes: [48, 52, 55] },
    null,
  ]), [
    { order: 1, chordName: "Custom voicing", notes: "A3 C4 E4", context: null },
    { order: 2, chordName: "Custom voicing", notes: "C3 E3 G3", context: null },
    { order: 3, chordName: "Custom voicing", notes: "Notes unavailable", context: null },
  ]);
  assert.deepEqual(savedProgressionDisplaySteps(null), []);
});

test("progression titles are trimmed and empty titles use the default", () => {
  assert.equal(normalizeProgressionTitle("  Night Changes  "), "Night Changes");
  assert.equal(normalizeProgressionTitle("   "), "Untitled Progression");
  assert.equal(normalizeProgressionTitle(null), "Untitled Progression");
});

test("an updated saved progression replaces one card without duplicates", () => {
  const updated = { id: 2, title: "Updated", progression: [{ notes: "G3 B3 D4" }] };
  const result = replaceSavedProgression([
    { id: 1, title: "First" },
    { id: 2, title: "Old" },
  ], updated);
  assert.deepEqual(result, [{ id: 1, title: "First" }, updated]);
  assert.equal(result.filter(item => item.id === 2).length, 1);
});

test("saved playback data preserves exact voicings and progression order", () => {
  assert.deepEqual(savedVoicingMidis({ notes: "57 60 64 67" }), [57, 60, 64, 67]);
  const saved = {
    progression: [
      { notes: "A3 C4 E4 G4" },
      { midi_notes: [58, 62, 65, 69, 72] },
    ],
  };
  const snapshot = structuredClone(saved);
  assert.deepEqual(savedProgressionMidis(saved), [
    [57, 60, 64, 67],
    [58, 62, 65, 69, 72],
  ]);
  assert.deepEqual(saved, snapshot);
});
