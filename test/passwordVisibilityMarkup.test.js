import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const authScreenUrl = new URL("../src/auth/AuthScreen.jsx", import.meta.url);

test("each password input owns independent visibility state", async () => {
  const source = await readFile(authScreenUrl, "utf8");

  assert.match(source, /export function PasswordInput\(/);
  assert.match(source, /const \[isVisible, setIsVisible\] = useState\(false\)/);
  assert.match(source, /type=\{isVisible \? "text" : "password"\}/);
  assert.match(source, /onClick=\{\(\) => setIsVisible\(current => !current\)\}/);
});

test("password visibility controls are accessible and cover both fields", async () => {
  const source = await readFile(authScreenUrl, "utf8");

  assert.match(source, /type="button"/);
  assert.match(source, /aria-label=\{isVisible \? "Hide password" : "Show password"\}/);
  assert.match(source, /aria-controls=\{id\}/);
  assert.match(source, /name="password"/);
  assert.match(source, /name="confirmPassword"/);
});

test("password visibility does not remove password validation", async () => {
  const source = await readFile(authScreenUrl, "utf8");

  assert.match(source, /form\.password\.length < 8/);
  assert.match(source, /form\.password !== form\.confirmPassword/);
  assert.match(source, /minLength=\{8\}/);
  assert.match(source, /required/);
});
