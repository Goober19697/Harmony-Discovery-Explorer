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

  assert.match(
    source,
    /tonicNegativeHarmony\(currentNotes, negativeReference\?\.pitchClass\)/,
  );
  assert.match(source, /analyzeNegativeHarmonyVoicing\(negativeAnalysisNotes\)/);
  assert.match(source, /<PianoKeys\s+midis=\{derivedNegativeNotes\}/s);
});

test("the Negative Harmony result displays its analyzed chord name without an interval subtitle", async () => {
  const source = await readFile(explorerUrl, "utf8");

  assert.match(source, /\{derivedNegativeLabel \|\| "Custom voicing"\}/);
  assert.doesNotMatch(source, /Interval qualities: \{derivedNegativeIntervalQualities\}/);
});

test("invalid analyzed chord roots disable Negative Harmony without an F fallback", async () => {
  const source = await readFile(explorerUrl, "utf8");

  assert.match(source, /disabled=\{!negativeReference\}/);
  assert.match(source, /Negative Harmony requires a recognized chord root\./);
  assert.doesNotMatch(source, /fixed tonic F/i);
});

test("Negative Harmony actions snapshot transformed notes and preserve metadata", async () => {
  const source = await readFile(explorerUrl, "utf8");

  assert.match(
    source,
    /function addDerivedNegativeHarmony\(\)[\s\S]*const exactNotes = derivedNegativeNotes\.slice\(\);[\s\S]*text,[\s\S]*label: derivedNegativeLabel,[\s\S]*midi_notes: exactNotes,[\s\S]*interval_qualities: derivedNegativeIntervalQualities,/,
  );
  assert.match(
    source,
    /async function saveDerivedNegativeHarmony\(\)[\s\S]*const exactNotes = derivedNegativeNotes\.slice\(\);[\s\S]*await handleSaveVoicing\(\s*exactNotes,\s*derivedNegativeLabel,\s*derivedNegativeMetadata,\s*derivedNegativeUsesFlats,/,
  );
  assert.doesNotMatch(
    source,
    /handleSaveVoicing\(\s*currentNotes,\s*derivedNegativeLabel/,
  );
});

test("Negative Harmony controls disable invalid or repeated submissions", async () => {
  const source = await readFile(explorerUrl, "utf8");

  assert.match(
    source,
    /if \(!hasDerivedNegativeResult \|\| negativeHarmonyAddLockRef\.current\) return;/,
  );
  assert.match(
    source,
    /if \(!hasDerivedNegativeResult \|\| negativeHarmonySaveLockRef\.current\) return;/,
  );
  assert.match(
    source,
    /onClick=\{saveDerivedNegativeHarmony\}[\s\S]*disabled=\{!hasDerivedNegativeResult \|\| negativeHarmonySaving\}/,
  );
  assert.match(
    source,
    /onClick=\{addDerivedNegativeHarmony\}[\s\S]*disabled=\{!hasDerivedNegativeResult \|\| negativeHarmonyAdding\}/,
  );
});
