import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const sourceUrl = new URL("../src/components/SavedLibrary.jsx", import.meta.url);

test("record delete controls share accessible markup and isolated delete handlers", async () => {
  const source = await readFile(sourceUrl, "utf8");

  assert.equal((source.match(/className="vl-library-record-delete"/g) || []).length, 2);
  assert.match(source, /aria-label=\{`Delete saved \$\{voicing\.chord_name/);
  assert.match(source, /aria-label=\{`Delete saved progression \$\{saved\.title/);
  assert.match(source, /onClick=\{\(\) => deleteVoicing\(voicing\)\}/);
  assert.match(source, /onClick=\{\(\) => deleteProgression\(saved\)\}/);
  assert.match(source, /<time>\{savedDate\(voicing\.created_at\)\}<\/time>/);
  assert.match(source, /<time>\{savedDate\(saved\.created_at\)\}<\/time>/);
});

test("the library reloads on open without exposing a manual refresh control", async () => {
  const source = await readFile(sourceUrl, "utf8");

  assert.match(source, /useEffect\(\(\) => \{\s*if \(open\) loadLibrary\(\);\s*\}, \[open\]\);/);
  assert.doesNotMatch(source, />Refresh</);
  assert.doesNotMatch(source, /refreshKey/);
});

test("new saves update an open library from live state", async () => {
  const source = await readFile(sourceUrl, "utf8");

  assert.match(source, /if \(open && savedVoicing\)/);
  assert.match(source, /if \(open && savedProgression\)/);
  assert.match(source, /\.\.\.items\.filter\(item => item\.id !== savedVoicing\.id\)/);
  assert.match(source, /\.\.\.items\.filter\(item => item\.id !== savedProgression\.id\)/);
});
