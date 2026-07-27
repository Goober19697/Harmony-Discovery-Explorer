import test from "node:test";
import assert from "node:assert/strict";

import {
  displayVoicingContext,
  visibleProgressions,
  visibleVoicings,
  voicingCategories,
} from "../src/savedLibraryFilters.js";

test("saved Negative Harmony context retains its source and hides interval details", () => {
  assert.equal(
    displayVoicingContext(
      "Negative Harmony · Am interpreted as ii of G · Interval qualities: major",
    ),
    "Negative Harmony · Am interpreted as ii of G",
  );
  assert.equal(
    displayVoicingContext("Shadow Voicing of B♭maj9"),
    "Shadow Voicing of B♭maj9",
  );
});

const voicings = [
  { id: 1, chord_name: "Am7", notes: "A3 C4 E4 G4", emotion: "Warm & At Rest", created_at: "2026-01-01", favorite: false },
  { id: 2, chord_name: "B♭maj9", notes: "58 62 65 69 72", emotion: "Negative harmony of Fmaj9", created_at: "2026-02-01", favorite: true },
  { id: 3, chord_name: "Cmaj7", notes: "C3 E3 G3 B3", emotion: "Current Voicing", created_at: "2026-03-01", favorite: true },
];

const progressions = [
  { id: 1, title: "Zulu", created_at: "2026-01-01", favorite: false, progression: [{ chord_name: "Am7", notes: "A3 C4 E4 G4" }] },
  { id: 2, title: "Amber", created_at: "2026-03-01", favorite: true, progression: [
    { chord_name: "Fmaj9", notes: "F3 A3 C4 E4 G4" },
    { chord_name: "B♭maj9", midi_notes: [58, 62, 65, 69, 72] },
    { chord_name: "Am7", notes: "A3 C4 E4 G4" },
  ] },
  { id: 3, title: "Middle", created_at: "2026-02-01", favorite: false, progression: new Array(5).fill({ chord_name: "C", notes: "C3 E3 G3" }) },
];

test("voicing search matches chord names, notes, and negative-harmony context", () => {
  assert.deepEqual(visibleVoicings(voicings, { query: "am7" }).map(item => item.id), [1]);
  assert.deepEqual(visibleVoicings(voicings, { query: "B♭3 D4" }).map(item => item.id), [2]);
  assert.deepEqual(visibleVoicings(voicings, { query: "fmaj9" }).map(item => item.id), [2]);
  assert.deepEqual(visibleVoicings(voicings, { query: "no match" }), []);
});

test("progression search matches title, chord names, and exact notes", () => {
  assert.deepEqual(visibleProgressions(progressions, { query: "amber" }).map(item => item.id), [2]);
  assert.deepEqual(visibleProgressions(progressions, { query: "B♭3 D4" }).map(item => item.id), [2]);
});

test("sorting supports newest, oldest, A-Z, and Z-A without mutation", () => {
  const snapshot = [...voicings];
  assert.deepEqual(visibleVoicings(voicings).map(item => item.id), [3, 2, 1]);
  assert.deepEqual(visibleVoicings(voicings, { sort: "oldest" }).map(item => item.id), [1, 2, 3]);
  assert.deepEqual(visibleVoicings(voicings, { sort: "az" }).map(item => item.id), [1, 2, 3]);
  assert.deepEqual(visibleVoicings(voicings, { sort: "za" }).map(item => item.id), [3, 2, 1]);
  assert.deepEqual(voicings, snapshot);
});

test("favorites, dynamic categories, and progression lengths filter records", () => {
  assert.deepEqual(visibleVoicings(voicings, { favoritesOnly: true }).map(item => item.id), [3, 2]);
  assert.deepEqual(voicingCategories(voicings), ["Current Voicing", "Negative Harmony", "Warm & At Rest"]);
  assert.deepEqual(visibleVoicings(voicings, { category: "Negative Harmony" }).map(item => item.id), [2]);
  assert.deepEqual(visibleProgressions(progressions, { length: "1-2" }).map(item => item.id), [1]);
  assert.deepEqual(visibleProgressions(progressions, { length: "3-4" }).map(item => item.id), [2]);
  assert.deepEqual(visibleProgressions(progressions, { length: "5+" }).map(item => item.id), [3]);
});
