import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const explorerUrl = new URL("../src/HarmonyDiscoveryExplorer.jsx", import.meta.url);

test("white and black piano keys share exact-MIDI pointer interaction", async () => {
  const source = await readFile(explorerUrl, "utf8");

  assert.equal((source.match(/\{\.\.\.interactionProps\(k\.m\)\}/g) || []).length, 2);
  assert.match(source, /onPointerDown: event => \{[\s\S]*activateAndPlay\(midi\);/);
  assert.match(source, /function activateAndPlay\(midi\)[\s\S]*onNotePlay\?\.\(midi\);/);
  assert.doesNotMatch(source, /onTouchStart/);
  assert.doesNotMatch(source, /onClick: event =>[\s\S]*activateAndPlay\(midi\)/);
});

test("piano keys expose octave-aware labels and Enter or Space activation", async () => {
  const source = await readFile(explorerUrl, "utf8");

  assert.match(source, /tabIndex: 0/);
  assert.match(source, /"aria-label": `Play \$\{midiToName\(midi, flats\)\}`/);
  assert.match(source, /event\.key !== "Enter" && event\.key !== " "/);
  assert.match(source, /if \(!event\.repeat\) activateAndPlay\(midi\);/);
  assert.match(source, /\.vl-piano-key:focus-visible/);
});

test("every rendered shared piano receives the existing note-play callback", async () => {
  const source = await readFile(explorerUrl, "utf8");
  const pianoInstances = source.match(/<PianoKeys\b/g) || [];
  const callbackBindings = source.match(/onNotePlay=\{playPianoNote\}/g) || [];

  assert.equal(pianoInstances.length, 5);
  assert.equal(callbackBindings.length, pianoInstances.length);
});

test("single-note playback reuses the existing synth without stopping chord playback", async () => {
  const source = await readFile(explorerUrl, "utf8");
  const functionSource = source.match(
    /async function playPianoNote\(midi\) \{([\s\S]*?)\n  \}\n\n  async function playTransition/,
  )?.[1];

  assert.ok(functionSource);
  assert.match(functionSource, /await unlockAudio\(\)/);
  assert.match(functionSource, /await ensureSynth\(\)/);
  assert.match(functionSource, /synth\.triggerAttackRelease\(freq\(midi\), 1\.2\)/);
  assert.doesNotMatch(functionSource, /releaseAll/);
  assert.match(source, /async function playChord\(midis, rowKey\)/);
});

test("pressed styling is transient and preserves the voicing fill colors", async () => {
  const source = await readFile(explorerUrl, "utf8");

  assert.match(source, /activeTimeoutsRef\.current\.set\(midi, setTimeout/);
  assert.match(source, /\}, 180\)\);/);
  assert.match(source, /fill=\{pressed\.has\(k\.m\) \? "#C98A3A" : "#EDE6D6"\}/);
  assert.match(source, /fill=\{pressed\.has\(k\.m\) \? "#C98A3A" : "#2A2D4A"\}/);
  assert.match(source, /touchAction: "manipulation"/);
  assert.match(source, /userSelect: "none"/);
});
