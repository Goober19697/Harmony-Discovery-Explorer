import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const explorerUrl = new URL("../src/HarmonyDiscoveryExplorer.jsx", import.meta.url);
const libraryUrl = new URL("../src/components/SavedLibrary.jsx", import.meta.url);

test("action rows use shared centered layout primitives without offset hacks", async () => {
  const source = await readFile(explorerUrl, "utf8");

  assert.match(source, /\.vl-control-row\s*\{[^}]*display:\s*flex;[^}]*align-items:\s*center;[^}]*gap:\s*10px;[^}]*min-height:\s*42px;/s);
  assert.match(source, /\.vl-generated-controls\s*\{[^}]*display:\s*flex;[^}]*align-items:\s*center;/s);
  assert.match(source, /\.vl-chord-header\s*\{[^}]*display:\s*flex;[^}]*align-items:\s*center;/s);
  assert.doesNotMatch(source, /\.vl-row > \.vl-(?:play-group|row-apply)\s*\{[^}]*margin-top:/s);
});

test("generated-card controls form one aligned row without an extra Add wrapper", async () => {
  const source = await readFile(explorerUrl, "utf8");

  assert.match(source, /playVoicing\(selectedNotes, r\.key\)[\s\S]*className="vl-bass-order"[\s\S]*showPreviousCandidate[\s\S]*showNextCandidate[\s\S]*onClick=\{\(\) => applyResult\(r\)\}/);
  assert.doesNotMatch(
    source,
    /flexDirection:\s*"column",\s*alignItems:\s*"flex-end"[\s\S]{0,180}applyResult\(r\)/,
  );
  assert.match(source, /className="vl-generated-controls"[\s\S]*playVoicing\(selectedNotes, r\.key\)[\s\S]*className="vl-bass-order"[\s\S]*applyResult\(r\)/);
  assert.match(source, /\.vl-play-control\s*\{[^}]*height:\s*42px;/s);
  assert.match(source, /\.vl-bass-order\s*\{[^}]*height:\s*42px;/s);
  assert.match(source, /\.vl-bass-order select\s*\{[^}]*height:\s*42px;/s);
  assert.match(source, /\.vl-row-apply\s*\{[^}]*height:\s*42px;/s);
  assert.doesNotMatch(source, /<span>Bass<\/span>/);
});

test("current and derived voicing action rows align play icons with adjacent controls", async () => {
  const source = await readFile(explorerUrl, "utf8");

  assert.ok((source.match(/className="vl-control-row"/g) || []).length >= 3);
  assert.match(source, /className="vl-control-row"[\s\S]*Show Negative Harmony[\s\S]*playVoicing\(currentNotes/);
  assert.match(source, /playVoicing\(negativeNotes, "negative"\)/);
  assert.match(source, /playVoicing\(result\.notes, `derived-negative-/);
});

test("voicing Save controls use the same full-height pill format as reveal controls", async () => {
  const source = await readFile(explorerUrl, "utf8");

  assert.ok((source.match(/className="vl-row-apply vl-save-action"/g) || []).length >= 4);
  assert.match(
    source,
    /\.vl-row-apply\.vl-save-action\s*\{[^}]*min-width:\s*72px;[^}]*height:\s*42px;[^}]*padding:\s*0 14px;[^}]*border-radius:\s*999px;[^}]*font-family:\s*'Inter'/s,
  );
  assert.match(
    source,
    /\.vl-save-progression\s*\{[^}]*height:\s*42px;[^}]*padding:\s*0 14px;[^}]*border-radius:\s*999px;/s,
  );
});

test("saved voicing and progression action rows align compact controls", async () => {
  const [explorer, library] = await Promise.all([
    readFile(explorerUrl, "utf8"),
    readFile(libraryUrl, "utf8"),
  ]);

  assert.match(
    explorer,
    /\.vl-library-card-actions\s*\{[^}]*display:\s*flex;[^}]*align-items:\s*center;[^}]*flex-wrap:\s*wrap;[^}]*gap:\s*8px;/s,
  );
  assert.match(explorer, /\.vl-single-voicing-actions\s*\{[^}]*align-items:\s*flex-start;/s);
  assert.match(explorer, /\.vl-single-voicing-actions \.vl-play-control\s*\{[^}]*height:\s*auto;/s);
  assert.match(explorer, /\.vl-single-voicing-actions > \.vl-row-apply\s*\{[^}]*align-self:\s*flex-start;/s);
  assert.match(library, /className="vl-library-card-actions vl-single-voicing-actions"/);
  assert.doesNotMatch(explorer, /\.vl-play-control\.has-tap \.vl-row-apply/);
  assert.match(library, /▶ Play"}[\s\S]*>\s*Restore\s*<\/button>/);
  assert.match(
    library,
    /onClick=\{\(\) => playProgression\(saved\)\}[\s\S]*showTapLabel=\{false\}[\s\S]*▶ Play Progression"}[\s\S]*>\s*Restore Progression\s*<\/button>/,
  );
});
