import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const explorerUrl = new URL("../src/HarmonyDiscoveryExplorer.jsx", import.meta.url);

test("the landing copy lives in a dedicated centered hero before the current-voicing form", async () => {
  const source = await readFile(explorerUrl, "utf8");
  const copy = "Discover beautiful voice leading, harmonic color, and inspiring chord";

  assert.match(
    source,
    /<header className="vl-hero">\s*<h1 className="vl-title display-title">Harmony Discovery Explorer<\/h1>\s*<p className="vl-sub">/,
  );
  assert.match(source, new RegExp(copy));
  assert.ok(source.indexOf('className="vl-hero"') < source.indexOf('htmlFor="notes"'));
  assert.doesNotMatch(source, /Enter a voicing, hear where it can move/);
});

test("hero typography is constrained, spacious, and responsive", async () => {
  const source = await readFile(explorerUrl, "utf8");

  assert.match(source, /\.vl-hero\s*\{[^}]*padding:\s*20px 16px 34px;[^}]*text-align:\s*center;/s);
  assert.match(source, /\.vl-title\s*\{[^}]*font-size:\s*clamp\(38px,\s*6vw,\s*52px\);[^}]*margin:\s*0 0 18px;[^}]*text-align:\s*center;/s);
  assert.match(source, /\.vl-sub\s*\{[^}]*font-weight:\s*400;[^}]*max-width:\s*660px;[^}]*line-height:\s*1\.65;[^}]*text-align:\s*center;/s);
  assert.match(source, /@media \(max-width: 700px\)[\s\S]*\.vl-hero \{ padding: 14px 4px 30px; \}[\s\S]*\.vl-title \{ font-size: clamp\(32px, 10vw, 42px\)/);
});
