import { analyzeVoicingOptions } from "./chordPatterns.js";
import { formatOrderedNotes } from "./noteParsing.js";

const CONVENTIONAL_ROOT_NAMES = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
const FLAT_ROOTS = new Set([3, 8, 10]);
export const SHADOW_MIN_MIDI = 41; // F2
const SHADOW_C3_MIDI = 48;
const SHADOW_CANDIDATE_FLOOR_CEILING = 77; // F5

// Reflect a voicing around its first note. The pivot remains fixed and every
// interval above it moves the same absolute distance below it.
export function negativeHarmony(midis) {
  if (!midis || midis.length === 0) return [];
  const pivot = midis[0];
  return midis
    .map(midi => pivot - (midi - pivot))
    .sort((a, b) => a - b);
}

function octavePlacements(midi) {
  const pitchClass = ((midi % 12) + 12) % 12;
  const first = SHADOW_MIN_MIDI +
    ((pitchClass - SHADOW_MIN_MIDI % 12 + 12) % 12);
  let center = midi;
  while (center < SHADOW_MIN_MIDI) center += 12;
  const lowest = Math.max(first, center - 24);
  const ceiling = Math.max(SHADOW_CANDIDATE_FLOOR_CEILING, center + 24);
  const placements = [];
  for (let pitch = lowest; pitch <= ceiling; pitch += 12) placements.push(pitch);
  return placements;
}

function shadowCandidateScore(assigned, raw) {
  const sounding = assigned.slice().sort((a, b) => a - b);
  let belowFloor = 0;
  let duplicatePitches = 0;
  let crossings = 0;
  let lowRegisterCompression = 0;
  let generalCompression = 0;
  let largeGaps = 0;

  for (let index = 0; index < assigned.length; index += 1) {
    if (assigned[index] < SHADOW_MIN_MIDI) belowFloor += 1;
    if (index > 0 && assigned[index] < assigned[index - 1]) crossings += 1;
  }

  for (let index = 1; index < sounding.length; index += 1) {
    const gap = sounding[index] - sounding[index - 1];
    if (gap === 0) duplicatePitches += 1;
    if (sounding[index - 1] < SHADOW_C3_MIDI && gap < 3) {
      lowRegisterCompression += 3 - gap;
    } else if (gap < 2) {
      generalCompression += 2 - gap;
    }
    if (gap > 12) largeGaps += gap - 12;
  }

  const span = sounding.length > 1
    ? sounding[sounding.length - 1] - sounding[0]
    : 0;
  const comfortableSpan = 12 + Math.max(0, sounding.length - 3) * 3;
  const excessiveSpan = Math.max(0, span - comfortableSpan);
  const displacement = assigned.reduce(
    (total, pitch, index) => total + Math.abs(pitch - raw[index]),
    0
  );

  // The large, descending weights express musical constraints before the
  // softer preferences for compact span and proximity to the raw mirror.
  return belowFloor * 1_000_000_000 +
    duplicatePitches * 10_000_000 +
    lowRegisterCompression * 1_000_000 +
    crossings * 100_000 +
    largeGaps * 10_000 +
    generalCompression * 1_000 +
    excessiveSpan * 100 +
    span * 10 +
    displacement;
}

function comparePitchLists(a, b) {
  for (let index = 0; index < Math.min(a.length, b.length); index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return a.length - b.length;
}

// This runs only after the exact mirror has been calculated. Every candidate
// retains one voice of the same pitch class for every raw voice.
export function normalizeShadowVoicingRegister(rawMidis) {
  if (!rawMidis || rawMidis.length === 0) return [];
  const raw = rawMidis.slice().sort((a, b) => a - b);
  if (raw.every(midi => midi >= SHADOW_MIN_MIDI)) return raw;
  const minimallyRaised = raw.map(midi => {
    let pitch = midi;
    while (pitch < SHADOW_MIN_MIDI) pitch += 12;
    return pitch;
  });
  const placements = raw.map(octavePlacements);
  let best = null;
  let bestScore = Infinity;

  function visit(index, assigned) {
    if (index === placements.length) {
      const score = shadowCandidateScore(assigned, raw);
      const sounding = assigned.slice().sort((a, b) => a - b);
      if (
        score < bestScore ||
        (score === bestScore && (!best || comparePitchLists(sounding, best) < 0))
      ) {
        bestScore = score;
        best = sounding;
      }
      return;
    }
    for (const pitch of placements[index]) {
      assigned.push(pitch);
      visit(index + 1, assigned);
      assigned.pop();
    }
  }

  visit(0, []);
  return best || minimallyRaised.sort((a, b) => a - b);
}

// Backwards-compatible descriptive alias used by existing callers and tests.
export const normalizeShadowVoicing = normalizeShadowVoicingRegister;

export function shadowVoicing(midis) {
  return normalizeShadowVoicingRegister(negativeHarmony(midis));
}

// Shadow harmony can land in an inversion, so its harmonic root must come from
// the complete pitch set rather than from the lowest reflected note. Chord
// roots use conventional spellings independently of the keyboard-note setting.
export function negativeHarmonyAnalysis(midis) {
  const recognized = analyzeVoicingOptions(midis, { includeUnplayedRoots: true })
    .filter(option => !option.fallback)
    .sort((a, b) =>
      Number(a.rootless) - Number(b.rootless) ||
      (a.rootless && b.rootless
        ? b.score[1] - a.score[1]
        : a.score[0] - b.score[0] || a.score[1] - b.score[1])
    )[0];
  return recognized || analyzeVoicingOptions(midis)[0] || null;
}

export function negativeHarmonyLabel(midis) {
  const recognized = negativeHarmonyAnalysis(midis);
  if (!recognized) return "Shadow voicing";
  const suffix = recognized.negativeHarmonySuffix || recognized.suffix;
  return CONVENTIONAL_ROOT_NAMES[recognized.rootPc] + suffix +
    (recognized.rootless ? " (rootless)" : "");
}

export function negativeHarmonyUsesFlats(midis) {
  const recognized = negativeHarmonyAnalysis(midis);
  return recognized ? FLAT_ROOTS.has(recognized.rootPc) : false;
}

export function negativeHarmonySourceDescription(sourceLabel, sourceNotes, useFlats = false) {
  const reliableLabel = typeof sourceLabel === "string" &&
    sourceLabel.trim() &&
    sourceLabel.trim().toLowerCase() !== "custom voicing";
  const source = reliableLabel
    ? sourceLabel.trim()
    : formatOrderedNotes(sourceNotes, { useFlats }) || "unknown voicing";
  return `Negative harmony of ${source}`;
}

export function shadowVoicingSourceDescription(sourceLabel, sourceNotes, useFlats = false) {
  const reliableLabel = typeof sourceLabel === "string" &&
    sourceLabel.trim() &&
    sourceLabel.trim().toLowerCase() !== "custom voicing";
  const source = reliableLabel
    ? sourceLabel.trim()
    : formatOrderedNotes(sourceNotes, { useFlats }) || "unknown voicing";
  return `Shadow Voicing of ${source}`;
}
