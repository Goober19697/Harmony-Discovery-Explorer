const TONIC_NAMES = [
  "C", "Db", "D", "Eb", "E", "F",
  "Gb", "G", "Ab", "A", "Bb", "B",
];

function pitchClass(value) {
  return ((value % 12) + 12) % 12;
}

function interpretation(
  sourceChordName,
  sourceChordRoot,
  sourceQuality,
  functionDegree,
  romanNumeral,
  tonicPitchClass,
) {
  const impliedTonicPitchClass = pitchClass(tonicPitchClass);
  const impliedTonicName = TONIC_NAMES[impliedTonicPitchClass];
  return {
    interpretationType: "functional",
    sourceChordName,
    sourceChordRoot,
    sourceQuality,
    functionDegree,
    romanNumeral,
    impliedTonicName,
    impliedTonicPitchClass,
    explanation: `${sourceChordName} interpreted as ${romanNumeral} of ${impliedTonicName}`,
  };
}

function rootReferenceInterpretation(
  sourceChordName,
  sourceChordRoot,
  tonicPitchClass,
) {
  const impliedTonicPitchClass = pitchClass(tonicPitchClass);
  return {
    interpretationType: "root-reference",
    sourceChordName,
    sourceChordRoot,
    sourceQuality: "other",
    functionDegree: null,
    romanNumeral: null,
    impliedTonicName: sourceChordRoot,
    impliedTonicPitchClass,
    explanation: `${sourceChordName} referenced to ${sourceChordRoot}`,
  };
}

function qualityFamily(quality) {
  const normalized = typeof quality === "string" ? quality.trim() : "";

  if (["m7b5", "m7♭5", "ø7"].includes(normalized)) {
    return "half-diminished";
  }
  if (["dim", "dim7"].includes(normalized)) {
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
  if ([
    "maj7", "maj9", "maj11", "maj13",
    "maj7#11", "maj9#11", "maj7♯11", "maj13♯11",
  ].includes(normalized)) {
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
  const sourceQuality = qualityFamily(quality);
  const make = (functionDegree, romanNumeral, tonic) =>
    interpretation(
      sourceChordName.trim(),
      sourceChordRoot.trim(),
      sourceQuality,
      functionDegree,
      romanNumeral,
      tonic,
    );

  switch (sourceQuality) {
    case "dominant":
      return [make(5, "V", root + 5)];
    case "major":
      return [
        make(1, "I", root),
        make(4, "IV", root - 5),
        make(5, "V", root + 5),
      ];
    case "major-seventh":
      return [
        make(1, "I", root),
        make(4, "IV", root - 5),
      ];
    case "minor":
      return [
        make(2, "ii", root - 2),
        make(3, "iii", root - 4),
        make(6, "vi", root + 3),
      ];
    case "diminished":
      return [make(7, "vii°", root + 1)];
    case "half-diminished":
      return [make(7, "viiø7", root + 1)];
    default:
      return [
        rootReferenceInterpretation(
          sourceChordName.trim(),
          sourceChordRoot.trim(),
          root,
        ),
      ];
  }
}
