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

function voicingMetrics(notes) {
  const sorted = notes.slice().sort((a, b) => a - b);
  const gaps = sorted.slice(1).map((midi, index) => midi - sorted[index]);
  const average = sorted.reduce((sum, midi) => sum + midi, 0) / sorted.length;
  const middle = Math.floor(sorted.length / 2);
  const median = sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
  return {
    sorted,
    lowest: sorted[0],
    highest: sorted[sorted.length - 1],
    span: sorted.length > 1 ? sorted[sorted.length - 1] - sorted[0] : 0,
    average,
    median,
    gaps,
    maximumGap: gaps.length ? Math.max(...gaps) : 0,
    averageGap: gaps.length
      ? gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length
      : 0,
  };
}

function negativeHarmonyRegisterScore(candidateNotes, sourceMetrics) {
  const candidate = voicingMetrics(candidateNotes);
  const spanDifference = Math.abs(candidate.span - sourceMetrics.span);
  const averageDifference = Math.abs(candidate.average - sourceMetrics.average);
  const medianDifference = Math.abs(candidate.median - sourceMetrics.median);
  const densityDifference = Math.abs(
    candidate.averageGap - sourceMetrics.averageGap
  );
  const boundaryDifference =
    Math.abs(candidate.lowest - sourceMetrics.lowest) +
    Math.abs(candidate.highest - sourceMetrics.highest);
  const movement = candidate.sorted.reduce(
    (sum, midi, index) => sum + Math.abs(midi - sourceMetrics.sorted[index]),
    0
  );

  // Gap quality is relative to the source so naturally open source voicings
  // retain their character, while compact sources reject isolated voices.
  const gapPenalty = candidate.gaps.reduce((total, gap) => {
    const beyondSource = Math.max(0, gap - sourceMetrics.maximumGap);
    if (gap >= 12) return total + 1_000_000 + beyondSource ** 2 * 100_000;
    if (gap >= 9) return total + 200_000 + beyondSource ** 2 * 30_000;
    if (gap >= 7) return total + beyondSource ** 2 * 8_000;
    return total + beyondSource ** 2 * 2_000;
  }, 0);
  const isolatedVoicePenalty = candidate.gaps.reduce(
    (total, gap) =>
      total + Math.max(0, gap - Math.max(8, sourceMetrics.maximumGap + 2)) ** 2 *
        150_000,
    0
  );

  // Source span is the density template. Going past its soft allowance is
  // possible, but deliberately much costlier than modest voice movement.
  const preferredMaximumSpan = sourceMetrics.span +
    Math.max(5, Math.round(sourceMetrics.span * 0.25));
  const excessiveSpan = Math.max(0, candidate.span - preferredMaximumSpan);
  const score =
    spanDifference * 200_000 +
    averageDifference * 80_000 +
    medianDifference * 30_000 +
    gapPenalty +
    densityDifference * 60_000 +
    boundaryDifference * 35_000 +
    movement * 3_000 +
    isolatedVoicePenalty +
    excessiveSpan ** 2 * 500_000;

  return {
    score,
    span: candidate.span,
    maximumGap: candidate.maximumGap,
    averageDifference,
    movement,
  };
}

function compareScoredCandidates(a, b) {
  if (!b) return -1;
  return a.score - b.score ||
    a.span - b.span ||
    a.maximumGap - b.maximumGap ||
    a.averageDifference - b.averageDifference ||
    a.movement - b.movement ||
    compareMidiLists(a.notes, b.notes);
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

  const sourceMetrics = voicingMetrics(sourceVoicing);

  function search(expansion) {
    const lower = Math.max(0, sourceMetrics.lowest - 12 - expansion);
    const upper = Math.min(127, sourceMetrics.highest + 12 + expansion);
    const placements = negativeHarmonyNotes.map(note => {
      const notes = [];
      const targetPitchClass = pitchClass(note);
      const first = lower + pitchClass(targetPitchClass - lower);
      for (let midi = first; midi <= upper; midi += 12) notes.push(midi);
      return notes;
    });
    let best = null;

    function visit(index, assigned, used) {
      if (index === placements.length) {
        const notes = assigned.slice().sort((a, b) => a - b);
        const scored = {
          ...negativeHarmonyRegisterScore(notes, sourceMetrics),
          notes,
        };
        if (compareScoredCandidates(scored, best) < 0) best = scored;
        return;
      }
      for (const midi of placements[index]) {
        if (used.has(midi)) continue;
        assigned.push(midi);
        used.add(midi);
        visit(index + 1, assigned, used);
        used.delete(midi);
        assigned.pop();
      }
    }

    visit(0, [], new Set());
    return best?.notes || null;
  }

  // The normal search is tightly bounded; expand only for repeated pitch
  // classes that cannot receive unique MIDI placements in that region.
  return search(0) ||
    search(12) ||
    search(24) ||
    negativeHarmonyNotes.slice().sort((a, b) => a - b);
}
