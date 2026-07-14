import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const standalonePath = new URL("../windows-simple/index.html", import.meta.url);

test("Windowsかんたん版は外部ファイルを必要としない", async () => {
  const html = await readFile(standalonePath, "utf8");

  assert.match(html, /Windows 11かんたん版/);
  assert.doesNotMatch(html, /<script\b[^>]*\bsrc=/i);
  assert.doesNotMatch(html, /<link\b[^>]*\brel=["']stylesheet["']/i);
  assert.doesNotMatch(html, /<script\b[^>]*\btype=["']module["']/i);
});

test("内蔵JavaScriptが構文エラーなく読み込める", async () => {
  const html = await readFile(standalonePath, "utf8");
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)];

  assert.equal(scripts.length, 1);
  assert.doesNotThrow(() => new Function(scripts[0][1]));
});
