const TONIC_NAMES = [
  "C", "Db", "D", "Eb", "E", "F",
  "Gb", "G", "Ab", "A", "Bb", "B",
];

function pitchClass(value) {
  return ((value % 12) + 12) % 12;
}

function interpretation(sourceChordName, sourceChordRoot, functionLabel, tonicPitchClass) {
  const impliedTonicPitchClass = pitchClass(tonicPitchClass);
  const impliedTonicName = TONIC_NAMES[impliedTonicPitchClass];
  return {
    functionLabel,
    sourceChordRoot,
    impliedTonicName,
    impliedTonicPitchClass,
    explanation: `${sourceChordName} interpreted as ${functionLabel} of ${impliedTonicName}`,
  };
}

function qualityFamily(quality) {
  const normalized = typeof quality === "string" ? quality.trim() : "";

  if (["dim", "dim7", "m7b5", "m7♭5", "ø7"].includes(normalized)) {
    return "diminished";
  }
  if (
    /^(?:7|9|11|13)(?:$|alt|[#b♯♭].*)/.test(normalized) ||
    normalized === "7sus"
  ) {
    return "dominant";
  }
  if (["", "6", "6/9", "add9", "add11"].includes(normalized)) {
    return "major";
  }
  if (["maj7", "maj9", "maj11", "maj13", "maj7♯11", "maj13♯11"].includes(normalized)) {
    return "major-seventh";
  }
  if (["m", "m6", "m7", "m9", "m11", "m13", "m add9", "m6/9"].includes(normalized)) {
    return "minor";
  }
  return null;
}

export function functionalNegativeHarmonyInterpretations({
  sourceChordName,
  sourceChordRoot,
  sourceRootPitchClass,
  quality,
}) {
  if (
    typeof sourceChordName !== "string" ||
    !sourceChordName.trim() ||
    typeof sourceChordRoot !== "string" ||
    !sourceChordRoot.trim() ||
    !Number.isInteger(sourceRootPitchClass)
  ) {
    return [];
  }

  const root = pitchClass(sourceRootPitchClass);
  const make = (functionLabel, tonic) =>
    interpretation(
      sourceChordName.trim(),
      sourceChordRoot.trim(),
      functionLabel,
      tonic,
    );

  switch (qualityFamily(quality)) {
    case "dominant":
      return [make("V", root + 5)];
    case "major":
      return [
        make("I", root),
        make("IV", root - 5),
        make("V", root + 5),
      ];
    case "major-seventh":
      return [
        make("I", root),
        make("IV", root - 5),
      ];
    case "minor":
      return [
        make("ii", root - 2),
        make("iii", root - 4),
        make("vi", root + 3),
      ];
    case "diminished":
      return [make("vii", root + 1)];
    default:
      return [];
  }
}
