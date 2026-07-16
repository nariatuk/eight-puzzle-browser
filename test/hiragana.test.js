import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

test("数字版とひらがな版に相互リンクがある", async () => {
  const [numberHtml, hiraganaHtml] = await Promise.all([
    readFile(new URL("index.html", root), "utf8"),
    readFile(new URL("hiragana/index.html", root), "utf8"),
  ]);

  assert.match(numberHtml, /href="hiragana\/"/);
  assert.match(hiraganaHtml, /href="\.\.\/"/);
  assert.match(hiraganaHtml, /data-tile-labels="あ,か,さ,た,な,は,ま,や"/);
  assert.match(hiraganaHtml, /<span>あ<\/span><span>か<\/span><span>さ<\/span>/);
});

test("メタル調デザインに四隅の光と反射アニメーションがある", async () => {
  const css = await readFile(new URL("hiragana/metal.css", root), "utf8");

  assert.match(css, /radial-gradient\(circle at 12% 9%/);
  assert.match(css, /radial-gradient\(circle at 88% 91%/);
  assert.match(css, /@keyframes metal-shine/);
  assert.match(css, /repeating-linear-gradient\(90deg/);
});

test("Windows両ゲーム版は外部ファイル不要で相互移動できる", async () => {
  const [numberHtml, hiraganaHtml] = await Promise.all([
    readFile(new URL("windows-combined/index.html", root), "utf8"),
    readFile(new URL("windows-combined/hiragana.html", root), "utf8"),
  ]);

  for (const html of [numberHtml, hiraganaHtml]) {
    assert.doesNotMatch(html, /<script\b[^>]*\bsrc=/i);
    assert.doesNotMatch(html, /<link\b[^>]*\brel=["']stylesheet["']/i);
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)];
    assert.equal(scripts.length, 1);
    assert.doesNotThrow(() => new Function(scripts[0][1]));
  }

  assert.match(numberHtml, /href="hiragana\.html"/);
  assert.match(hiraganaHtml, /href="index\.html"/);
});
