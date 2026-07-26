import { formatOrderedNotes } from "./noteParsing.js";

export function voicingCategory(record) {
  const emotion = typeof record?.emotion === "string" ? record.emotion.trim() : "";
  return emotion.toLowerCase().startsWith("negative harmony of")
    ? "Negative Harmony"
    : emotion || "Uncategorized";
}

export function voicingCategories(records) {
  return [...new Set(records.map(voicingCategory))].sort((a, b) => a.localeCompare(b));
}

function timestamp(value) {
  const parsed = Date.parse(value || "");
  return Number.isNaN(parsed) ? 0 : parsed;
}

function sortRecords(records, sort, titleFor) {
  const copied = [...records];
  if (sort === "oldest") {
    return copied.sort((a, b) => timestamp(a.created_at) - timestamp(b.created_at) || a.id - b.id);
  }
  if (sort === "az" || sort === "za") {
    const direction = sort === "az" ? 1 : -1;
    return copied.sort((a, b) =>
      direction * titleFor(a).localeCompare(titleFor(b), undefined, { sensitivity: "base" })
    );
  }
  return copied.sort((a, b) => timestamp(b.created_at) - timestamp(a.created_at) || b.id - a.id);
}

export function visibleVoicings(records, {
  query = "",
  sort = "newest",
  favoritesOnly = false,
  category = "all",
} = {}) {
  const needle = query.trim().toLowerCase();
  const filtered = records.filter(record => {
    const searchable = [
      record.chord_name,
      formatOrderedNotes(record.notes),
      record.emotion,
    ].filter(Boolean).join(" ").toLowerCase();
    return (!needle || searchable.includes(needle)) &&
      (!favoritesOnly || record.favorite === true) &&
      (category === "all" || voicingCategory(record) === category);
  });
  return sortRecords(filtered, sort, record => record.chord_name || "Custom voicing");
}

export function visibleProgressions(records, {
  query = "",
  sort = "newest",
  favoritesOnly = false,
  length = "all",
} = {}) {
  const needle = query.trim().toLowerCase();
  const filtered = records.filter(record => {
    const steps = Array.isArray(record.progression) ? record.progression : [];
    const searchable = [
      record.title,
      ...steps.flatMap(step => [
        step?.chord_name,
        formatOrderedNotes(step?.notes) || formatOrderedNotes(step?.midi_notes),
      ]),
    ].filter(Boolean).join(" ").toLowerCase();
    const count = steps.length;
    const lengthMatches = length === "all" ||
      (length === "1-2" && count >= 1 && count <= 2) ||
      (length === "3-4" && count >= 3 && count <= 4) ||
      (length === "5+" && count >= 5);
    return (!needle || searchable.includes(needle)) &&
      (!favoritesOnly || record.favorite === true) &&
      lengthMatches;
  });
  return sortRecords(filtered, sort, record => record.title || "Untitled Progression");
}
