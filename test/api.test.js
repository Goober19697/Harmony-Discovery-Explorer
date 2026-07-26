import test from "node:test";
import assert from "node:assert/strict";

import {
  deleteSavedProgression,
  deleteSavedVoicing,
  getCurrentUser,
  getSavedProgressions,
  getSavedVoicings,
  loginUser,
  logoutUser,
  registerUser,
  saveProgression,
  saveVoicing,
  setSavedRequestUnauthorizedHandler,
  updateProgression,
  updateSavedProgression,
  updateVoicing,
} from "../src/services/api.js";
import { formatOrderedNotes } from "../src/noteParsing.js";
import { negativeHarmonySourceDescription } from "../src/negativeHarmony.js";

test("authentication helpers include credentials on every request", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, options = {}) => {
    requests.push([url, options]);
    return {
      ok: true,
      json: async () => url.endsWith("/logout")
        ? { message: "Logged out." }
        : { user: { id: 1, email: "user@example.com" } },
    };
  };

  try {
    await registerUser({ email: "user@example.com", password: "password" });
    await loginUser({ email: "user@example.com", password: "password" });
    await getCurrentUser();
    await logoutUser();

    assert.deepEqual(
      requests.map(([url]) => url),
      [
        "http://localhost:5001/api/auth/register",
        "http://localhost:5001/api/auth/login",
        "http://localhost:5001/api/auth/me",
        "http://localhost:5001/api/auth/logout",
      ],
    );
    for (const [, options] of requests) {
      assert.equal(options.credentials, "include");
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("every saved-library request includes credentials and never adds user_id", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, options = {}) => {
    requests.push([url, options]);
    return {
      ok: true,
      json: async () => {
        if (url.endsWith("/voicings")) return { voicings: [], voicing: { id: 1 } };
        if (url.endsWith("/progressions")) {
          return { progressions: [], progression: { id: 2 } };
        }
        if (url.includes("/voicings/")) return { voicing: { id: 1 } };
        return { progression: { id: 2 } };
      },
    };
  };

  try {
    await saveVoicing({ notes: "A3 C4 E4" });
    await getSavedVoicings();
    await updateVoicing(1, { favorite: true });
    await deleteSavedVoicing(1);
    await saveProgression({
      title: "Minor",
      progression: [{ notes: "A3 C4 E4" }],
    });
    await getSavedProgressions();
    await updateProgression(2, { title: "Mine" });
    await updateSavedProgression(2, [{ notes: "A3 C4 E4" }]);
    await deleteSavedProgression(2);

    assert.equal(requests.length, 9);
    for (const [, options] of requests) {
      assert.equal(options.credentials, "include");
      if (options.body) {
        assert.equal(
          Object.prototype.hasOwnProperty.call(JSON.parse(options.body), "user_id"),
          false,
        );
      }
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("a saved-library 401 invokes the stale-session handler", async () => {
  const originalFetch = globalThis.fetch;
  let expired = false;
  setSavedRequestUnauthorizedHandler(() => {
    expired = true;
  });
  globalThis.fetch = async () => ({
    ok: false,
    status: 401,
    json: async () => ({ error: "Authentication required." }),
  });

  try {
    await assert.rejects(getSavedVoicings(), /Authentication required/);
    assert.equal(expired, true);
  } finally {
    setSavedRequestUnauthorizedHandler(null);
    globalThis.fetch = originalFetch;
  }
});

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
      "http://localhost:5001/api/voicings",
      "http://localhost:5001/api/progressions",
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
    assert.equal(url, "http://localhost:5001/api/progressions");
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
    assert.equal(url, "http://localhost:5001/api/progressions/7");
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
      ["http://localhost:5001/api/voicings/3", "DELETE"],
      ["http://localhost:5001/api/progressions/8", "DELETE"],
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("updateVoicing patches favorite state", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "http://localhost:5001/api/voicings/4");
    assert.equal(options.method, "PATCH");
    assert.deepEqual(JSON.parse(options.body), { favorite: true });
    return { ok: true, json: async () => ({ voicing: { id: 4, favorite: true } }) };
  };
  try {
    const result = await updateVoicing(4, { favorite: true });
    assert.equal(result.voicing.favorite, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
