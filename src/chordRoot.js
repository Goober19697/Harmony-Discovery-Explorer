const NATURAL_PITCH_CLASSES = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const INVALID_CHORD_NAMES = new Set([
  "custom voicing",
  "unknown",
  "no chord",
]);

export function chordRootFromName(chordName) {
  if (typeof chordName !== "string") return null;
  const trimmed = chordName.trim();
  if (!trimmed || INVALID_CHORD_NAMES.has(trimmed.toLowerCase())) return null;

  const match = trimmed.match(/^([A-Ga-g])([#b♯♭]?)(.*)$/);
  if (!match) return null;

  const [, letterValue, accidental = "", remainder] = match;
  if (
    remainder &&
    !/^(?:m|min|maj|dim|aug|sus|add|\d|\(|\/|[#b♯♭])/.test(remainder)
  ) {
    return null;
  }

  const letter = letterValue.toUpperCase();
  const accidentalOffset = accidental === "#" || accidental === "♯"
    ? 1
    : accidental === "b" || accidental === "♭"
      ? -1
      : 0;
  const pitchClass = (
    NATURAL_PITCH_CLASSES[letter] + accidentalOffset + 12
  ) % 12;

  return {
    name: letter + accidental,
    pitchClass,
  };
}
