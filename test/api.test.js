import test from "node:test";
import assert from "node:assert/strict";

import {
  deleteSavedProgression,
  deleteSavedVoicing,
  getSavedProgressions,
  getSavedVoicings,
  saveProgression,
  saveVoicing,
  updateProgression,
  updateSavedProgression,
} from "../src/services/api.js";
import { formatOrderedNotes } from "../src/noteParsing.js";
import { negativeHarmonySourceDescription } from "../src/negativeHarmony.js";

test("negative-harmony voicing save sends exact notes and source context", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    const payload = JSON.parse(options.body);
    assert.deepEqual(payload, {
      notes: "B♭3 D4 F4 A4 C5",
      chord_name: "B♭maj9",
      emotion: "Negative harmony of Fmaj9",
    });
    return {
      ok: true,
      json: async () => ({ message: "Voicing saved", voicing: payload }),
    };
  };

  try {
    await saveVoicing({
      notes: formatOrderedNotes([58, 62, 65, 69, 72], { useFlats: true }),
      chord_name: "B♭maj9",
      emotion: negativeHarmonySourceDescription("Fmaj9", [53, 57, 60, 64, 67], true),
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("saved library helpers load both collection endpoints", async () => {
  const originalFetch = globalThis.fetch;
  const urls = [];
  globalThis.fetch = async url => {
    urls.push(url);
    return {
      ok: true,
      json: async () => url.endsWith("/voicings")
        ? { voicings: [{ id: 1 }] }
        : { progressions: [{ id: 2 }] },
    };
  };

  try {
    const voicings = await getSavedVoicings();
    const progressions = await getSavedProgressions();
    assert.deepEqual(voicings.voicings, [{ id: 1 }]);
    assert.deepEqual(progressions.progressions, [{ id: 2 }]);
    assert.deepEqual(urls, [
      "http://127.0.0.1:5000/api/voicings",
      "http://127.0.0.1:5000/api/progressions",
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("saveProgression posts the ordered progression payload", async () => {
  const originalFetch = globalThis.fetch;
  const payload = {
    title: "Untitled Progression",
    progression: [
      { chord_name: "C", notes: "C3 E3 G3", midi_notes: [48, 52, 55] },
      { chord_name: "Am", notes: "A2 C3 E3", midi_notes: [45, 48, 52], emotion: "sad" },
    ],
  };

  globalThis.fetch = async (url, options) => {
    assert.equal(url, "http://127.0.0.1:5000/api/progressions");
    assert.equal(options.method, "POST");
    assert.deepEqual(JSON.parse(options.body), payload);
    return {
      ok: true,
      json: async () => ({ message: "Progression saved", progression: payload }),
    };
  };

  try {
    const result = await saveProgression(payload);
    assert.equal(result.message, "Progression saved");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("saveProgression surfaces the backend validation error", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 400,
    json: async () => ({ error: "progression must be a non-empty list" }),
  });

  try {
    await assert.rejects(
      saveProgression({ title: "Untitled Progression", progression: [] }),
      /progression must be a non-empty list/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("updateSavedProgression patches the remaining ordered steps", async () => {
  const originalFetch = globalThis.fetch;
  const steps = [
    { chord_name: "Fmaj9", notes: "F3 A3 C4 E4 G4" },
    { chord_name: "Bm7", notes: "B2 D3 F♯3 A3" },
  ];
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "http://127.0.0.1:5000/api/progressions/7");
    assert.equal(options.method, "PATCH");
    assert.deepEqual(JSON.parse(options.body), { progression: steps });
    return {
      ok: true,
      json: async () => ({ progression: { id: 7, progression: steps } }),
    };
  };

  try {
    const result = await updateSavedProgression(7, steps);
    assert.deepEqual(result.progression.progression, steps);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("updateProgression patches a title without sending progression data", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    assert.deepEqual(JSON.parse(options.body), { title: "Midnight Resolve" });
    return {
      ok: true,
      json: async () => ({ progression: { id: 7, title: "Midnight Resolve" } }),
    };
  };
  try {
    const result = await updateProgression(7, { title: "Midnight Resolve" });
    assert.equal(result.progression.title, "Midnight Resolve");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("saved record delete helpers target only their complete record endpoints", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push([url, options.method]);
    return { ok: true, json: async () => ({ message: "Deleted" }) };
  };
  try {
    await deleteSavedVoicing(3);
    await deleteSavedProgression(8);
    assert.deepEqual(calls, [
      ["http://127.0.0.1:5000/api/voicings/3", "DELETE"],
      ["http://127.0.0.1:5000/api/progressions/8", "DELETE"],
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
