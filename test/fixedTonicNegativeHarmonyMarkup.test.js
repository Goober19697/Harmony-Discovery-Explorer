import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const explorerUrl = new URL("../src/HarmonyDiscoveryExplorer.jsx", import.meta.url);

test("Negative Harmony has an independent control and result panel", async () => {
  const source = await readFile(explorerUrl, "utf8");

  assert.match(source, /Show Shadow Voicing/);
  assert.match(source, /Show Negative Harmony/);
  assert.match(source, /showNegativeHarmony/);
  assert.match(source, /showFixedNegativeHarmony/);
});

test("the piano and existing analyzer receive the transformed MIDI sequence", async () => {
  const source = await readFile(explorerUrl, "utf8");

  assert.match(source, /fixedTonicNegativeHarmony\(currentNotes\)/);
  assert.match(source, /analyzeVoicing\(fixedNegativeNotes\)/);
  assert.match(source, /<PianoKeys\s+midis=\{fixedNegativeNotes\}/s);
});

test("the Negative Harmony result displays chord name and interval qualities", async () => {
  const source = await readFile(explorerUrl, "utf8");

  assert.match(source, /\{fixedNegativeLabel \|\| "Custom voicing"\}/);
  assert.match(
    source,
    /Interval qualities: \{fixedNegativeIntervalQualities\}/,
  );
});
