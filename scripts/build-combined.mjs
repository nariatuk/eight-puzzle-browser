import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(scriptDirectory, "..");
const outputDirectory = path.join(rootDirectory, "windows-combined");

const [
  numberHtml,
  hiraganaHtml,
  baseCss,
  metalCss,
  puzzleSource,
  appSource,
] = await Promise.all([
  readFile(path.join(rootDirectory, "index.html"), "utf8"),
  readFile(path.join(rootDirectory, "hiragana", "index.html"), "utf8"),
  readFile(path.join(rootDirectory, "styles.css"), "utf8"),
  readFile(path.join(rootDirectory, "hiragana", "metal.css"), "utf8"),
  readFile(path.join(rootDirectory, "src", "puzzle.js"), "utf8"),
  readFile(path.join(rootDirectory, "src", "app.js"), "utf8"),
]);

const standalonePuzzleSource = puzzleSource.replace(/^export\s+/gm, "");
const standaloneAppSource = appSource.replace(
  /^import\s*\{[\s\S]*?\}\s*from\s*["']\.\/puzzle\.js["'];\s*/,
  "",
);
const standaloneScript = `${standalonePuzzleSource}\n\n${standaloneAppSource}`;

function createStandalonePage(html, css, replacements = []) {
  let output = html
    .replace("<!doctype html>", "<!doctype html>\n<!-- Windows用：外部ファイル不要の単一HTML版 -->")
    .replace(/^\s*<link\s+rel=["']stylesheet["'][^>]*>\s*$/gm, "")
    .replace("  </head>", `    <style>\n${css}\n    </style>\n  </head>`)
    .replace(
      /<script\s+type=["']module["']\s+src=["'][^"']+["']><\/script>/,
      `<script>\n${standaloneScript}\n    </script>`,
    );

  for (const [from, to] of replacements) {
    output = output.replaceAll(from, to);
  }

  if (/<script\b[^>]*\bsrc=/i.test(output) || /<link\b[^>]*\brel=["']stylesheet["']/i.test(output)) {
    throw new Error("外部ファイル参照がWindows用HTMLに残っています。");
  }
  return output;
}

const numberStandalone = createStandalonePage(numberHtml, baseCss, [
  ['href="hiragana/"', 'href="hiragana.html"'],
]);
const hiraganaStandalone = createStandalonePage(hiraganaHtml, `${baseCss}\n${metalCss}`, [
  ['href="../"', 'href="index.html"'],
]);

await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  writeFile(path.join(outputDirectory, "index.html"), numberStandalone, "utf8"),
  writeFile(path.join(outputDirectory, "hiragana.html"), hiraganaStandalone, "utf8"),
]);

console.log("windows-combined に数字版とひらがな版を生成しました。");
