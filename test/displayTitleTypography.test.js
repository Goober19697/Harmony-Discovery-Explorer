import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const stylesUrl = new URL("../src/styles.css", import.meta.url);
const authScreenUrl = new URL("../src/auth/AuthScreen.jsx", import.meta.url);
const explorerUrl = new URL("../src/HarmonyDiscoveryExplorer.jsx", import.meta.url);
const savedLibraryUrl = new URL("../src/components/SavedLibrary.jsx", import.meta.url);

test("application titles share the dedicated display font stack", async () => {
  const [styles, authScreen, explorer, savedLibrary] = await Promise.all([
    readFile(stylesUrl, "utf8"),
    readFile(authScreenUrl, "utf8"),
    readFile(explorerUrl, "utf8"),
    readFile(savedLibraryUrl, "utf8"),
  ]);

  assert.match(
    styles,
    /--display-title-font:\s*Didot,\s*"Bodoni 72",\s*"Times New Roman",\s*serif;/,
  );
  assert.match(styles, /\.display-title\s*\{[^}]*font-family:\s*var\(--display-title-font\)/s);
  assert.match(authScreen, /className="auth-title display-title"/);
  assert.match(explorer, /className="vl-title display-title"/);
  assert.match(savedLibrary, /className="vl-library-title display-title"/);
});
