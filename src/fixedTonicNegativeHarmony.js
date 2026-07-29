function pitchClass(value) {
  return ((value % 12) + 12) % 12;
}

export function negativeHarmonyPitchClass(
  originalPitchClass,
  tonicPitchClass,
) {
  if (!Number.isInteger(tonicPitchClass)) return null;
  return pitchClass(2 * pitchClass(tonicPitchClass) + 7 - pitchClass(originalPitchClass));
}

// Assign a transformed pitch class to the closest octave of its source voice.
// An exact tritone tie resolves downward so the result is deterministic.
export function nearestMidiForPitchClass(originalMidi, targetPitchClass) {
  const normalizedTarget = pitchClass(targetPitchClass);
  const lower = originalMidi - pitchClass(originalMidi - normalizedTarget);
  const upper = lower + 12;
  const lowerDistance = Math.abs(originalMidi - lower);
  const upperDistance = Math.abs(upper - originalMidi);
  return lowerDistance <= upperDistance ? lower : upper;
}

export function tonicNegativeHarmony(midis, tonicPitchClass) {
  if (!Array.isArray(midis) || !Number.isInteger(tonicPitchClass)) return [];
  return midis.map(originalMidi => {
    const transformedPitchClass = negativeHarmonyPitchClass(
      originalMidi,
      tonicPitchClass,
    );
    return nearestMidiForPitchClass(originalMidi, transformedPitchClass);
  });
}

function compareMidiLists(a, b) {
  for (let index = 0; index < Math.min(a.length, b.length); index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return a.length - b.length;
}

function negativeHarmonyRegisterScore(assigned, sourceVoicing) {
  const candidate = assigned.slice().sort((a, b) => a - b);
  const source = sourceVoicing.slice().sort((a, b) => a - b);
  const sourceSpan = source.length > 1 ? source[source.length - 1] - source[0] : 0;
  const candidateSpan = candidate.length > 1
    ? candidate[candidate.length - 1] - candidate[0]
    : 0;
  const sourceAverage = source.reduce((sum, midi) => sum + midi, 0) / source.length;
  const candidateAverage = candidate.reduce((sum, midi) => sum + midi, 0) / candidate.length;
  const sourceMovement = candidate.reduce(
    (sum, midi, index) => sum + Math.abs(midi - source[index]),
    0
  );
  let duplicatePitches = 0;
  let largeGaps = 0;
  let isolatedNotes = 0;
  let crossings = 0;

  for (let index = 1; index < assigned.length; index += 1) {
    if (assigned[index] < assigned[index - 1]) crossings += 1;
  }
  for (let index = 1; index < candidate.length; index += 1) {
    const gap = candidate[index] - candidate[index - 1];
    if (gap === 0) duplicatePitches += 1;
    if (gap > 12) largeGaps += gap - 12;
  }
  if (candidate.length > 1) {
    isolatedNotes += Math.max(0, candidate[1] - candidate[0] - 12);
    isolatedNotes += Math.max(
      0,
      candidate[candidate.length - 1] - candidate[candidate.length - 2] - 12
    );
  }

  const lowExtreme = Math.max(0, source[0] - candidate[0] - 12);
  const highExtreme = Math.max(
    0,
    candidate[candidate.length - 1] - source[source.length - 1] - 12
  );
  const spanGrowth = Math.max(0, candidateSpan - sourceSpan);

  return duplicatePitches * 10_000_000 +
    isolatedNotes * 1_000_000 +
    largeGaps * 500_000 +
    crossings * 100_000 +
    sourceMovement * 10_000 +
    Math.abs(candidateAverage - sourceAverage) * 2_000 +
    spanGrowth * 1_000 +
    Math.abs(candidateSpan - sourceSpan) * 100 +
    (lowExtreme + highExtreme) * 10_000;
}

// This is intentionally separate from Shadow Voicing normalization: it has no
// F2 floor and optimizes only for proximity to the source voicing's register.
export function optimizeNegativeHarmonyRegister(
  negativeHarmonyNotes,
  sourceVoicing,
) {
  if (
    !Array.isArray(negativeHarmonyNotes) ||
    !negativeHarmonyNotes.length ||
    !Array.isArray(sourceVoicing) ||
    sourceVoicing.length !== negativeHarmonyNotes.length
  ) return [];

  const source = sourceVoicing.slice().sort((a, b) => a - b);
  const sourceCenter = source.reduce((sum, midi) => sum + midi, 0) / source.length;
  const placements = negativeHarmonyNotes.map(note => {
    const targetPitchClass = pitchClass(note);
    const center = nearestMidiForPitchClass(Math.round(sourceCenter), targetPitchClass);
    return [-24, -12, 0, 12, 24]
      .map(offset => center + offset)
      .filter(midi => midi >= 0 && midi <= 127);
  });
  let best = null;
  let bestScore = Infinity;

  function visit(index, assigned) {
    if (index === placements.length) {
      const candidate = assigned.slice().sort((a, b) => a - b);
      const score = negativeHarmonyRegisterScore(assigned, source);
      if (
        score < bestScore ||
        (score === bestScore && (!best || compareMidiLists(candidate, best) < 0))
      ) {
        best = candidate;
        bestScore = score;
      }
      return;
    }
    for (const midi of placements[index]) {
      assigned.push(midi);
      visit(index + 1, assigned);
      assigned.pop();
    }
  }

  visit(0, []);
  return best || negativeHarmonyNotes.slice().sort((a, b) => a - b);
}
