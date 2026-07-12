# Video Shelf MCP Server

AIアシスタント（CursorやClaude Desktopなど）が、ローカル動画ファイルからサムネイルを自動抽出し、Cloudflare R2にアップロードして、動画台帳である `data/videos.json` に自動登録するためのMCPサーバーです。

## 提供するツール

1. **`generate_thumbnail`**: 動画ファイルから指定された秒数（デフォルト2秒）のフレームをサムネイル画像（WebP）として切り出します。
2. **`upload_to_r2`**: ローカルファイル（動画やサムネイル画像）をCloudflare R2にアップロードし、公開URLを返します。
3. **`register_video_data`**: 動画のメタデータを `data/videos.json` に追加し、日付順・表示順（sortOrder）に並べ替えて保存します。

---

## セットアップ手順

### 前提条件
ローカル環境で Cloudflare の認証が済んでいる必要があります。
（`npx wrangler@3 whoami` コマンドを実行して、ログイン状態であることを確認してください。）

### 1. 環境変数の設定
`mcp-server` ディレクトリ内に `.env` ファイルを作成します。

```bash
cd mcp-server
cp .env.example .env
```

`.env` の内容はデフォルトで以下のように構成されています（必要に応じて修正してください）：
```env
R2_BUCKET_NAME=video-shelf
R2_PUBLIC_URL=https://pub-d27b649f7b1c46b4a4e032fec7c6d6e5.r2.dev
```

---

## AIクライアントへの登録方法

### A. Cursor の場合

1. Cursorの `Settings (右上の歯車)` -> `Features` -> `MCP` に移動します。
2. **`+ Add New MCP Server`** をクリックします。
3. 以下を設定して「Save」します：
   - **Name**: `video-shelf-mcp`
   - **Type**: `stdio`
   - **Command**: `node /path/to/your/video-shelf/mcp-server/index.js`
     *(※ `node` コマンドがパスに通っている必要があります。絶対パスで指定してください)*

### B. Claude Desktop の場合

1. 設定ファイル（Macの場合: `~/Library/Application Support/Claude/claude_desktop_config.json`）を開きます。
2. `mcpServers` セクションに以下のように追記します：

```json
{
  "mcpServers": {
    "video-shelf": {
      "command": "node",
      "args": [
        "/path/to/your/video-shelf/mcp-server/index.js"
      ],
      "env": {
        "R2_BUCKET_NAME": "video-shelf",
        "R2_PUBLIC_URL": "https://pub-d27b649f7b1c46b4a4e032fec7c6d6e5.r2.dev"
      }
    }
  }
}
```

*(※ `.env` に設定しておけば、`env` の指定を省略できる場合もありますが、Claude Desktopのプロセスに環境変数を引き渡すためにここに直接書くのが確実です。)*

---

## 使い方（AIへの指示の例）

Cursorのチャット欄やClaude Desktopで、以下のように指示を出します。

**指示の例：**
> 「ローカルにある `~/Downloads/trip_sample.mp4` を動画リストに追加して。
> タイトルは『2026年夏のハワイ旅行』、説明は『ワイキキビーチの夕暮れと波の音。』、場所タグは『ハワイ』にして。」

これだけで、AIがMCPサーバーのツールを順に呼び出し：
1. `generate_thumbnail` で `images/thumbnails/202607-hawaii.webp` を生成
2. `upload_to_r2` で動画とサムネイルの両方をR2へアップロード
3. `register_video_data` で `data/videos.json` にレコードを追記＆ソート

を一挙に自動で行ってくれます。
