import test from "node:test";
import assert from "node:assert/strict";

import { saveProgression } from "../src/services/api.js";

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
