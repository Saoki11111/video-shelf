# 個人用動画サイト 設計

## 1. 目的

Google Drive上の個人動画を、一覧・絞り込み・再生・共有できる軽量な静的サイトを作る。
運用費と保守負担を抑え、Cloudflare Pagesの無料枠での公開を基本とする。

## 2. 技術構成

- フロントエンド: HTML / CSS / Vanilla JavaScript
- データ: 静的な `videos.json`
- 動画保存・再生: Google Drive
- 公開: Cloudflare Pages
- お気に入り保存: ブラウザの `localStorage`
- DB、認証、API、サーバー処理: 使用しない

Astroは動画数や画面数が増えた場合の移行候補とし、初期実装では導入しない。

## 3. ディレクトリ構成案

```text
/
├── index.html           # 一覧画面
├── video.html           # 動画詳細画面
├── data/
│   └── videos.json
├── css/
│   └── style.css
└── js/
    ├── app.js           # 一覧・絞り込み・お気に入り
    └── video.js         # 詳細・再生・共有
```

## 4. videos.json のデータ形式

```json
[
  {
    "id": "202603-hongkong",
    "title": "香港 2026年3月",
    "description": "香港旅行の動画",
    "publishedAt": "2026-03-01",
    "tags": ["旅行", "香港"],
    "driveFileId": "GOOGLE_DRIVE_FILE_ID",
    "sortOrder": 1
  },
  {
    "id": "202601-ishigaki",
    "title": "石垣島 2026年1月",
    "description": "石垣島旅行の動画",
    "publishedAt": "2026-01-01",
    "tags": ["旅行", "沖縄"],
    "driveFileId": "GOOGLE_DRIVE_FILE_ID",
    "sortOrder": 2
  },
  {
    "id": "202509-shanghai",
    "title": "上海 2025年9月",
    "description": "上海旅行の動画",
    "publishedAt": "2025-09-01",
    "tags": ["旅行", "上海"],
    "driveFileId": "GOOGLE_DRIVE_FILE_ID",
    "sortOrder": 3
  }
]
```

ルール:

- `id` は一意で、公開後は変更しない。
- 新着順は `publishedAt` の降順とする。
- 人気順は再生数を使わず、`sortOrder` の昇順とする。
- `driveFileId` にはGoogle Drive共有URL全体ではなくファイルIDだけを保存する。
- 初期データは動作確認用動画 `202603_hongkong.mp4`、`202601_ishigaki.mp4`、`202509_shanhai.mp4` を元に登録する。表示名は `shanhai` を「上海」とする。

## 5. 画面構成

### 一覧画面 (`index.html`)

- サイト名
- 並び順切り替え: 新着順 / 人気順
- タグ絞り込み
- 動画カード一覧
- お気に入りのみ表示

### 詳細画面 (`video.html?id=動画ID`)

- タイトル、説明、公開日、タグ
- Google Drive埋め込みプレーヤー
- お気に入りボタン
- LINE共有ボタン
- 一覧へ戻るリンク

## 6. 機能一覧

| 機能 | 方針 |
| --- | --- |
| 新着 | `publishedAt` の降順で表示 |
| タグ絞り込み | 選択タグを含む動画だけ表示 |
| 人気順 | `sortOrder` の昇順で表示 |
| お気に入り | 動画IDを `localStorage` に保存 |
| 動画詳細 | URLの `id` と `videos.json` を照合 |
| LINE共有 | 詳細画面の公開URLを共有 |

お気に入りは端末・ブラウザ単位であり、同期やバックアップは行わない。

## 7. Google Drive動画URLの扱い

1. 動画をGoogle Driveへアップロードする。
2. 共有設定を「リンクを知っている全員が閲覧可」にする。
3. 共有URLからファイルIDを取り出し、`driveFileId` に記載する。
4. 詳細画面で次の埋め込みURLを組み立てる。

```text
https://drive.google.com/file/d/{driveFileId}/preview
```

動画ファイルや共有URLをリポジトリへ置かない。Google Drive側の共有停止、処理待ち、帯域制限により再生できない場合があるため、公開後にシークを含めて確認する。

## 8. LINE共有の方針

LINEの共有URLを使用し、Google Drive URLではなくサイトの詳細URLを共有する。

```text
https://social-plugins.line.me/lineit/share?url={URLエンコードした詳細URL}
```

共有先で内容を識別しやすくするため、将来必要になれば動画ごとの静的HTML生成とOGP設定を追加する。初期版では共通OGPで運用する。

## 9. 将来拡張案

- サムネイル画像、検索、複数タグ選択
- Astroへの移行と動画ごとの静的ページ生成
- OGPの動画別最適化
- `videos.json` のスキーマ検証
- データ更新が増えた場合のCMSまたはDB導入
- 非公開運用が必要になった場合のCloudflare Access導入
- Google Driveの制限が問題になった場合のCloudflare R2等への移行

## 10. 実装ステップ

1. 3本の動画をGoogle Driveへアップロードし、共有設定と再生を確認する。
2. `videos.json` にメタデータとファイルIDを登録する。
3. 一覧画面と詳細画面をHTML/CSSで作成する。
4. JSON読込、並び替え、タグ絞り込みを実装する。
5. お気に入りとLINE共有を実装する。
6. ローカルHTTPサーバーで3本の表示・再生・シークを確認する。
7. Cloudflare Pagesへ公開し、PCとスマートフォンで確認する。
