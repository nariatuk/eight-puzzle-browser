import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(scriptDirectory, "..");
const outputDirectory = path.join(rootDirectory, "windows-simple");

const [htmlSource, cssSource, puzzleSource, appSource] = await Promise.all([
  readFile(path.join(rootDirectory, "index.html"), "utf8"),
  readFile(path.join(rootDirectory, "styles.css"), "utf8"),
  readFile(path.join(rootDirectory, "src", "puzzle.js"), "utf8"),
  readFile(path.join(rootDirectory, "src", "app.js"), "utf8"),
]);

const standalonePuzzleSource = puzzleSource.replace(/^export\s+/gm, "");
const standaloneAppSource = appSource.replace(
  /^import\s*\{[\s\S]*?\}\s*from\s*["']\.\/puzzle\.js["'];\s*/,
  "",
);

const standaloneStyles = `
${cssSource}

.standalone-ribbon {
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 20;
  padding: 8px 12px;
  border: 1px solid rgba(255, 250, 240, 0.38);
  border-radius: 999px;
  color: #fffaf0;
  background: #3f7458;
  box-shadow: 0 5px 16px rgba(47, 33, 25, 0.2);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
}

@media (max-width: 520px) {
  .standalone-ribbon {
    position: static;
    width: fit-content;
    margin: 10px 10px 0 auto;
  }
}
`;

const standaloneScript = `${standalonePuzzleSource}\n\n${standaloneAppSource}`;

const standaloneHtml = htmlSource
  .replace(
    "<!doctype html>",
    `<!doctype html>\n<!-- Windows 11かんたん版：この1ファイルだけで動作します -->`,
  )
  .replace("<title>木の8パズル</title>", "<title>木の8パズル｜Windowsかんたん版</title>")
  .replace(
    /<link\s+rel=["']stylesheet["']\s+href=["']styles\.css["']\s*>/,
    `<style>\n${standaloneStyles}\n    </style>`,
  )
  .replace(
    "  <body>",
    `  <body>\n    <div class="standalone-ribbon">Windows 11かんたん版</div>`,
  )
  .replace(
    /<script\s+type=["']module["']\s+src=["']src\/app\.js["']><\/script>/,
    `<script>\n${standaloneScript}\n    </script>`,
  );

if (standaloneHtml.includes('type="module"') || standaloneHtml.includes('src="src/app.js"')) {
  throw new Error("モジュール版の参照が単一HTMLに残っています。");
}

await mkdir(outputDirectory, { recursive: true });
await writeFile(path.join(outputDirectory, "index.html"), standaloneHtml, "utf8");

console.log("windows-simple/index.html を生成しました。");
