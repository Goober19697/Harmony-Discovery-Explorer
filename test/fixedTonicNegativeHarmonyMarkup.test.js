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
    /tonicNegativeHarmony\(\s*currentNotes,\s*interpretation\.impliedTonicPitchClass,/,
  );
  assert.match(source, /analyzeNegativeHarmonyVoicing\(analysisNotes\)/);
  assert.match(source, /<PianoKeys\s+midis=\{result\.notes\}/s);
});

test("each Negative Harmony result displays its interpretation and analysis", async () => {
  const source = await readFile(explorerUrl, "utf8");

  assert.match(source, /negativeHarmonyResults\.map\(result =>/);
  assert.match(source, /Negative Harmony · \{result\.explanation\}/);
  assert.match(source, /\{result\.chordName \|\| "Custom voicing"\}/);
  assert.match(source, /Interval qualities: \{result\.intervalQualities\}/);
});

test("unsupported functional interpretations disable Negative Harmony without guessing", async () => {
  const source = await readFile(explorerUrl, "utf8");

  assert.match(source, /disabled=\{!hasNegativeHarmonyResults\}/);
  assert.match(
    source,
    /No standard functional Negative Harmony interpretation is available\./,
  );
  assert.doesNotMatch(source, /fixed tonic F/i);
});

test("Negative Harmony actions snapshot transformed notes and preserve metadata", async () => {
  const source = await readFile(explorerUrl, "utf8");

  assert.match(
    source,
    /function addDerivedNegativeHarmony\(result\)[\s\S]*const exactNotes = result\.notes\.slice\(\);[\s\S]*label: result\.chordName,[\s\S]*midi_notes: exactNotes,[\s\S]*interval_qualities: result\.intervalQualities,[\s\S]*negative_harmony_function: result\.functionLabel,[\s\S]*negative_harmony_tonic: result\.impliedTonicName,/,
  );
  assert.match(
    source,
    /async function saveDerivedNegativeHarmony\(result\)[\s\S]*const exactNotes = result\.notes\.slice\(\);[\s\S]*await handleSaveVoicing\(\s*exactNotes,\s*result\.chordName,\s*result\.metadata,\s*result\.useFlats,/,
  );
  assert.doesNotMatch(
    source,
    /handleSaveVoicing\(\s*currentNotes,\s*result\.chordName/,
  );
});

test("Negative Harmony controls disable invalid or repeated submissions", async () => {
  const source = await readFile(explorerUrl, "utf8");

  assert.match(
    source,
    /negativeHarmonyAddLockRef\.current\.has\(result\.id\)/,
  );
  assert.match(
    source,
    /negativeHarmonySaveLockRef\.current\.has\(result\.id\)/,
  );
  assert.match(
    source,
    /onClick=\{\(\) => saveDerivedNegativeHarmony\(result\)\}[\s\S]*disabled=\{!result\.notes\.length \|\| !result\.chordName \|\| isSaving\}/,
  );
  assert.match(
    source,
    /onClick=\{\(\) => addDerivedNegativeHarmony\(result\)\}[\s\S]*disabled=\{!result\.notes\.length \|\| !result\.chordName \|\| isAdding\}/,
  );
});
