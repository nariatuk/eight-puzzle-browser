# 8パズルコレクション（eight-puzzle-browser）

C-GPT-5.6　Solによるパズルゲームの書き込み

ブラウザーで遊べる3×3の8パズルです。木製玩具風の数字版と、角が輝くメタル調のひらがな版を用意しています。どちらも手動操作のほか、現在の配置から最短手数を計算して自動でそろえられます。

## インターネットで遊ぶ

| ゲーム | デザイン | プレイ |
|---|---|---|
| 数字8パズル | 木製玩具風 | **[数字版を開く](https://nariatuk.github.io/eight-puzzle-browser/)** |
| ひらがな8パズル | メタル調 | **[ひらがな版を開く](https://nariatuk.github.io/eight-puzzle-browser/hiragana/)** |

両方のゲーム画面上部に切替リンクがあり、いつでも相互に移動できます。

## 数字・ひらがな両方入りWindows版

数字版とひらがな版をオフラインで相互に切り替えられるセットです。

### [両ゲーム入りWindows版 ZIPをダウンロード](downloads/eight-puzzle-number-hiragana-v2.0.0.zip?raw=1)

ZIPを右クリックして「すべて展開」し、`index.html`をダブルクリックしてください。PythonやNode.js、インターネット接続は不要です。

## 数字版だけのWindows 11かんたん版

**通常はこちらをお使いください。** ZIPを展開して、入っている`index.html`をダブルクリックするだけで起動します。PythonやNode.js、インターネット接続は不要です。

### [Windows 11かんたん版 ZIPをダウンロード](downloads/eight-puzzle-windows-simple-v1.0.0.zip?raw=1)

1. 上のリンクからZIPをダウンロードします。
2. ZIPを右クリックして「すべて展開」を選びます。
3. 展開先の`index.html`をダブルクリックします。
4. Microsoft EdgeやGoogle Chromeでゲームが始まります。

## ファイル構成

| 種類 | 保存場所 | 起動方法 | 用途 |
|---|---|---|---|
| 数字版モジュール | [`index.html`](index.html) | Webサーバー／GitHub Pages | 木製の数字版 |
| ひらがな版モジュール | [`hiragana/index.html`](hiragana/index.html) | Webサーバー／GitHub Pages | メタル調のひらがな版 |
| 数字版単体Windows用 | [`windows-simple/index.html`](windows-simple/index.html) | ダブルクリック | 数字版だけを使う場合 |
| 両ゲーム入りWindows用 | [`windows-combined/`](windows-combined/) | ダブルクリック | 数字・ひらがなを切替可能 |

数字版は木製玩具風、ひらがな版はメタル調なので、画面を見ただけでも区別できます。

## 主な機能

- 空きマスの上下左右に隣接するプレートだけを移動
- 初級（4～8手）・中級（10～16手）・上級（18～24手）のシャッフル
- 必ず完成可能な盤面を生成
- A*探索による最短手数の自動整列
- 自動整列速度を「遅い・標準・速い」から選択
- 自動整列の一時停止・再開・中止
- 手動の手数、経過時間、最短手数、自動操作の進行を表示
- パソコン、タブレット、スマートフォンに対応

## 開発・モジュール版をブラウザーで動かす

開発・モジュール版は、ローカルWebサーバーでフォルダーを公開して、リポジトリ直下の`index.html`を開きます。

Pythonが利用できる場合：

```bash
python -m http.server 8000
```

その後、ブラウザーで `http://localhost:8000` を開きます。Visual Studio Codeの「Live Server」などでも実行できます。

## 遊び方

1. 初級・中級・上級から難易度を選びます。
2. 「シャッフルして始める」を押します。
3. 明るく表示された、空きマスに隣接するプレートをクリックまたはタップします。
4. 数字版は `1, 2, 3 / 4, 5, 6 / 7, 8, 空き`、ひらがな版は `あ, か, さ / た, な, は / ま, や, 空き` の順に並べると完成です。
5. 解き方を見たい場合は「最短手数で自動整列」を押します。

## テスト

Node.jsが利用できる場合、次のコマンドでパズルロジックを検証できます。

```bash
npm test
```

外部ライブラリは使用していません。

## Windowsかんたん版の再生成

開発版を変更した場合、次のコマンドで単一HTML版を再生成できます。

```bash
npm run build:standalone
```

数字・ひらがな両方入りWindows版は次のコマンドで再生成できます。

```bash
npm run build:combined
```
