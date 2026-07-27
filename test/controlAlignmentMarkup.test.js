import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const explorerUrl = new URL("../src/HarmonyDiscoveryExplorer.jsx", import.meta.url);
const libraryUrl = new URL("../src/components/SavedLibrary.jsx", import.meta.url);

test("compact action buttons and selects share a standard control height", async () => {
  const source = await readFile(explorerUrl, "utf8");

  assert.match(source, /\.vl-row-apply\s*\{[^}]*height:\s*32px;[^}]*display:\s*inline-flex;[^}]*align-items:\s*center;/s);
  assert.match(source, /\.vl-bass-order select\s*\{[^}]*height:\s*32px;/s);
  assert.match(source, /\.vl-bass-order select\s*\{[^}]*border-radius:\s*6px;/s);
  assert.match(source, /\.vl-mode-toggle\s*\{[^}]*height:\s*32px;[^}]*align-items:\s*stretch;/s);
});

test("generated-card controls form one aligned row without an extra Add wrapper", async () => {
  const source = await readFile(explorerUrl, "utf8");

  assert.match(source, /playVoicing\(selectedNotes, r\.key\)[\s\S]*className="vl-bass-order"[\s\S]*showPreviousCandidate[\s\S]*showNextCandidate[\s\S]*onClick=\{\(\) => applyResult\(r\)\}/);
  assert.doesNotMatch(
    source,
    /flexDirection:\s*"column",\s*alignItems:\s*"flex-end"[\s\S]{0,180}applyResult\(r\)/,
  );
  assert.match(source, /\.vl-play-group\s*\{[^}]*min-width:\s*38px;/s);
  assert.match(
    source,
    /\.vl-row > \.vl-play-group\s*\{[^}]*align-self:\s*flex-start;[^}]*margin-top:\s*13px;/s,
  );
  assert.match(
    source,
    /\.vl-row > \.vl-row-apply\s*\{[^}]*align-self:\s*flex-start;[^}]*margin-top:\s*12px;/s,
  );
});

test("current and derived voicing action rows align play icons with adjacent controls", async () => {
  const source = await readFile(explorerUrl, "utf8");

  assert.ok(
    (source.match(/display: "flex", alignItems: "flex-start", gap: 10/g) || []).length >= 3,
  );
  assert.match(
    source,
    /alignItems: "flex-start", gap: 10, flexWrap: "wrap"[\s\S]*Show Negative Harmony[\s\S]*playVoicing\(currentNotes/,
  );
  assert.match(source, /playVoicing\(negativeNotes, "negative"\)/);
  assert.match(source, /playVoicing\(result\.notes, `derived-negative-/);
});

test("saved voicing and progression action rows align compact controls", async () => {
  const [explorer, library] = await Promise.all([
    readFile(explorerUrl, "utf8"),
    readFile(libraryUrl, "utf8"),
  ]);

  assert.match(
    explorer,
    /\.vl-library-card-actions\s*\{[^}]*display:\s*flex;[^}]*align-items:\s*flex-start;[^}]*flex-wrap:\s*wrap;[^}]*gap:\s*8px;/s,
  );
  assert.match(library, /▶ Play"}[\s\S]*>\s*Restore\s*<\/button>/);
  assert.match(
    library,
    /onClick=\{\(\) => playProgression\(saved\)\}[\s\S]*showTapLabel=\{false\}[\s\S]*▶ Play Progression"}[\s\S]*>\s*Restore Progression\s*<\/button>/,
  );
});
