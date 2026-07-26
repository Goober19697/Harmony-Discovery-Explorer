import { formatOrderedNotes, parseVoicing } from "./noteParsing.js";

export function savedProgressionDisplaySteps(progression) {
  if (!Array.isArray(progression)) return [];

  return progression.map((step, index) => {
    const record = step && typeof step === "object" ? step : {};
    return {
      order: index + 1,
      chordName: typeof record.chord_name === "string" && record.chord_name.trim()
        ? record.chord_name.trim()
        : "Custom voicing",
      notes: formatOrderedNotes(record.notes) ||
        formatOrderedNotes(record.midi_notes) ||
        "Notes unavailable",
      context: typeof record.emotion === "string" && record.emotion.trim()
        ? record.emotion.trim()
        : null,
    };
  });
}

export function normalizeProgressionTitle(title) {
  return typeof title === "string" && title.trim()
    ? title.trim()
    : "Untitled Progression";
}

export function replaceSavedProgression(items, updated) {
  return items.map(item => item.id === updated.id ? updated : item);
}

export function savedVoicingMidis(saved) {
  const text = formatOrderedNotes(saved?.notes) || formatOrderedNotes(saved?.midi_notes);
  return parseVoicing(text).midis;
}

export function savedProgressionMidis(saved) {
  if (!Array.isArray(saved?.progression)) return [];
  return saved.progression
    .map(step => savedVoicingMidis(step))
    .filter(notes => notes.length);
}
