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

test("each interpretation independently optimizes its identified chord near the source register", async () => {
  const source = await readFile(explorerUrl, "utf8");

  assert.match(
    source,
    /functionalInterpretations\.map\(interpretation =>[\s\S]*?const rawNotes = tonicNegativeHarmony\([\s\S]*?const analysis = analyzeNegativeHarmonyVoicing\(analysisNotes\)[\s\S]*?const notes = optimizeNegativeHarmonyRegister\(rawNotes, currentNotes\)/,
  );
});

test("each Negative Harmony result displays its interpretation and chord analysis compactly", async () => {
  const source = await readFile(explorerUrl, "utf8");

  assert.match(source, /negativeHarmonyResults\.map\(result =>/);
  assert.match(source, /Negative Harmony — \{result\.explanation\}/);
  assert.match(source, /\{result\.chordName \|\| "Custom voicing"\}/);
  assert.doesNotMatch(source, /Interval qualities: \{result\.intervalQualities\}/);
  assert.match(source, /intervalQualitiesForAnalysis\(analysis\)/);
  assert.match(source, /className="vl-negative-shadow vl-negative-result"/);
  assert.match(source, /\.vl-negative-result \.vl-piano-wrap\s*\{[^}]*margin-top:\s*16px;/s);
});

test("only analyses without a recognized root disable Negative Harmony", async () => {
  const source = await readFile(explorerUrl, "utf8");

  assert.match(source, /disabled=\{!hasNegativeHarmonyResults\}/);
  assert.match(
    source,
    /Negative Harmony requires a recognized chord root\./,
  );
  assert.doesNotMatch(source, /fixed tonic F/i);
});

test("Negative Harmony actions snapshot transformed notes and preserve metadata", async () => {
  const source = await readFile(explorerUrl, "utf8");

  assert.match(
    source,
    /function addDerivedNegativeHarmony\(result\)[\s\S]*const exactNotes = result\.notes\.slice\(\);[\s\S]*label: result\.chordName,[\s\S]*midi_notes: exactNotes,[\s\S]*interval_qualities: result\.intervalQualities,[\s\S]*negative_harmony_function: result\.romanNumeral,[\s\S]*negative_harmony_tonic: result\.impliedTonicName,/,
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

test("interpretation headings preserve chord-symbol and Roman-numeral casing", async () => {
  const source = await readFile(explorerUrl, "utf8");

  assert.match(source, /className="vl-negative-interpretation"/);
  assert.match(
    source,
    /\.vl-negative-interpretation\s*\{[^}]*text-transform:\s*none;/s,
  );
  assert.doesNotMatch(source, /result\.explanation\.toUpperCase/);
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
