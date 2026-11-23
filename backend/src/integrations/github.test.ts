import assert from "node:assert/strict";
import test from "node:test";
import { parseRepositoryUrl } from "./github.js";

test("accepts a standard GitHub repository URL", () => {
  assert.deepEqual(
    parseRepositoryUrl("https://github.com/facebook/react"),
    { owner: "facebook", repository: "react" },
  );
});

test("accepts www and removes the .git suffix", () => {
  assert.deepEqual(
    parseRepositoryUrl("https://www.github.com/vercel/next.js.git"),
    { owner: "vercel", repository: "next.js" },
  );
});

test("rejects empty and non-string values", () => {
  assert.throws(() => parseRepositoryUrl(""), /Informe a URL/);
  assert.throws(() => parseRepositoryUrl(undefined), /Informe a URL/);
});

test("rejects hosts outside github.com", () => {
  assert.throws(
    () => parseRepositoryUrl("https://github.example.com/user/repo"),
    /github.com/,
  );
});

test("rejects HTTP and incomplete repository paths", () => {
  assert.throws(
    () => parseRepositoryUrl("http://github.com/user/repo"),
    /HTTPS/,
  );
  assert.throws(
    () => parseRepositoryUrl("https://github.com/user"),
    /formato/,
  );
  assert.throws(
    () => parseRepositoryUrl("https://github.com/user/repo/tree/main"),
    /formato/,
  );
});
