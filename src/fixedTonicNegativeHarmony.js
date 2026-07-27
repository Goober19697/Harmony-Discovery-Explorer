export const NEGATIVE_HARMONY_TONIC_PC = 5;

function pitchClass(value) {
  return ((value % 12) + 12) % 12;
}

export function negativeHarmonyPitchClass(
  originalPitchClass,
  tonicPitchClass = NEGATIVE_HARMONY_TONIC_PC,
) {
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

export function fixedTonicNegativeHarmony(
  midis,
  tonicPitchClass = NEGATIVE_HARMONY_TONIC_PC,
) {
  if (!Array.isArray(midis)) return [];
  return midis.map(originalMidi => {
    const transformedPitchClass = negativeHarmonyPitchClass(
      originalMidi,
      tonicPitchClass,
    );
    return nearestMidiForPitchClass(originalMidi, transformedPitchClass);
  });
}
