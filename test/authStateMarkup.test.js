import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const contextUrl = new URL("../src/auth/AuthContext.jsx", import.meta.url);
const mainUrl = new URL("../src/main.jsx", import.meta.url);
const libraryUrl = new URL("../src/components/SavedLibrary.jsx", import.meta.url);

test("logout clears authenticated state before the network request completes", async () => {
  const source = await readFile(contextUrl, "utf8");
  const logoutBody = source.match(/async function logout\(\) \{([\s\S]*?)\n  \}/)?.[1] || "";

  assert.ok(logoutBody.indexOf("setUser(null)") < logoutBody.indexOf("await logoutUser()"));
});

test("a stale saved-library session clears the user and exposes a login notice", async () => {
  const source = await readFile(contextUrl, "utf8");

  assert.match(source, /setSavedRequestUnauthorizedHandler\(\(\) => \{/);
  assert.match(source, /setUser\(null\)/);
  assert.match(source, /Your session expired\. Please log in again\./);
});

test("each authenticated app mount starts with a new library state", async () => {
  const [mainSource, librarySource] = await Promise.all([
    readFile(mainUrl, "utf8"),
    readFile(libraryUrl, "utf8"),
  ]);

  assert.match(
    mainSource,
    /isAuthenticated \? <HarmonyDiscoveryExplorer \/> : <AuthScreen \/>/,
  );
  assert.match(librarySource, /const \[voicings, setVoicings\] = useState\(\[\]\)/);
  assert.match(
    librarySource,
    /const \[progressions, setProgressions\] = useState\(\[\]\)/,
  );
  assert.match(
    librarySource,
    /Promise\.all\(\[\s*getSavedVoicings\(\),\s*getSavedProgressions\(\),\s*\]\)/,
  );
});
