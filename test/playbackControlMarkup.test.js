import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const controlUrl = new URL("../src/components/PlaybackControl.jsx", import.meta.url);
const explorerUrl = new URL("../src/HarmonyDiscoveryExplorer.jsx", import.meta.url);
const libraryUrl = new URL("../src/components/SavedLibrary.jsx", import.meta.url);

test("the shared playback control places an instructional Tap label beneath its button", async () => {
  const source = await readFile(controlUrl, "utf8");

  assert.match(source, /className="vl-play-group"/);
  assert.match(source, /<button[\s\S]*aria-label=\{ariaLabel\}[\s\S]*\{children\}[\s\S]*<\/button>/);
  assert.match(source, /<span className="vl-play-label" aria-hidden="true">Tap<\/span>/);
});

test("all application voicing and progression playback controls use the shared control", async () => {
  const [explorer, library] = await Promise.all([
    readFile(explorerUrl, "utf8"),
    readFile(libraryUrl, "utf8"),
  ]);

  assert.equal((explorer.match(/<PlaybackControl/g) || []).length, 6);
  assert.equal((library.match(/<PlaybackControl/g) || []).length, 2);
  assert.doesNotMatch(explorer, /<button[^>]*className="vl-play-btn"/s);
  assert.doesNotMatch(library, /<button[\s\S]{0,200}aria-label=\{`Play /);
});

test("Tap styling stays subtle, centered, and responsive through the shared group", async () => {
  const source = await readFile(explorerUrl, "utf8");

  assert.match(
    source,
    /\.vl-play-group\s*\{[^}]*flex-direction:\s*column;[^}]*align-items:\s*center;[^}]*gap:\s*2px;/s,
  );
  assert.match(
    source,
    /\.vl-play-label\s*\{[^}]*color:\s*var\(--ink-dim\);[^}]*font-family:\s*'Inter'[^}]*font-size:\s*9px;/s,
  );
});
