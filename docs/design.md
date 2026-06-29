# Video Shelf 設計

## 1. 目的

旅行動画を、家族や知人が迷わず見られる軽量な動画サイトにする。
更新は年2〜3回を想定し、管理画面を持たない静的構成で運用する。

## 2. 基本方針

- UI: ポップ×Netflix風のダークデザイン
- フロントエンド: HTML / CSS / Vanilla JavaScript
- 公開: Cloudflare Pages
- 動画: Google Drive
- データ: `videos.json`
- 個人のいいね: ブラウザの `localStorage`
- DB、ログイン、API、サーバー処理: 使用しない

管理画面は作らない。動画追加時はGoogle Driveへアップロードし、`videos.json` だけ更新する。

## 3. 保存先と公開範囲

```text
Cloudflare Pages
├── HTML / CSS / JavaScript
├── videos.json
└── サムネイル画像

Google Drive
└── 動画本体
```

- Cloudflare Pagesへ動画本体は置かない。
- Google Driveは「リンクを知っている全員が閲覧可」にする。
- 完全な非公開サイトではない。URLを知る人は動画を閲覧できる。
- ローカル開発時だけDownloads内の動画を参照する。

## 4. ディレクトリ構成

```text
/
├── index.html             # TOP
├── ranking.html           # 視聴数・いいね数ランキング
├── videos.html            # 全動画一覧
├── video.html             # 動画詳細
├── data/
│   └── videos.json
├── images/
│   └── thumbnails/        # サムネイル
├── css/
│   └── style.css
└── js/
    ├── app.js
    ├── ranking.js
    ├── videos.js
    └── video.js
```

## 5. videos.json

```json
[
  {
    "id": "202603-hongkong",
    "title": "香港、光と熱気の街",
    "description": "2026年3月の香港旅行。",
    "publishedAt": "2026-03-01",
    "tags": ["香港"],
    "thumbnail": "images/thumbnails/202603-hongkong.webp",
    "driveFileId": "GOOGLE_DRIVE_FILE_ID",
    "viewCount": 0,
    "likeCount": 0
  }
]
```

ルール:

- `id` は一意とし、公開後は変更しない。
- タグは場所を表す1件だけにする。
- 新着順は `publishedAt` の降順とする。
- `viewCount` と `likeCount` は初期版では手動更新する。
- ローカル確認時のみ `driveFileId` の代わりに `src` を使用できる。

## 6. 画面構成

### TOP (`index.html`)

1. 新着3本のサムネイルカルーセル
2. 新着動画3本
3. 視聴数TOP3
4. いいね数TOP3
5. 「全動画を見る」リンク

カルーセルは5秒ごとに自動移動する。左右ボタン、ドット、スワイプでも操作できるようにし、マウスを乗せた時とキーボード操作中は自動移動を止める。

### 視聴数ランキング (`ranking.html?by=views`)

- `viewCount` の降順でTOP5を表示

### いいねランキング (`ranking.html?by=likes`)

- `likeCount` の降順でTOP5を表示

### 全動画 (`videos.html`)

- 全動画一覧
- 新着順 / 視聴数順 / いいね数順
- 場所タグによる絞り込み
- いいねした動画だけ表示

### 動画詳細 (`video.html?id=動画ID`)

- Google Drive埋め込みプレーヤー
- タイトル、公開日、説明、場所タグ
- いいねボタン
- LINE共有

## 7. ナビゲーション

- TOP
- 視聴数TOP5
- いいねTOP5
- 全動画

常に同じヘッダーを表示し、現在のページを強調する。管理画面への導線は置かない。

## 8. いいね・視聴数

### 個人のいいね

- ログイン不要
- 動画IDを `localStorage` に保存
- 同じブラウザ、同じ端末、同じ公開URLでは保持される
- ブラウザデータ削除、別端末、別ブラウザ、ドメイン変更では引き継がれない

### 公開ランキング

DBとAPIを使わないため、全ユーザーのいいね数と視聴数は自動集計できない。
初期版は `videos.json` の `likeCount` と `viewCount` を管理者が手動更新してランキングを作る。

自動集計が必要になった時だけ、Cloudflare WorkersとD1等を追加する。

## 9. タグ

- 1動画につき場所タグ1件
- 初期タグ: 香港、石垣島、上海
- タグ選択時は既存ボタンを再描画し、重複生成しない
- 「すべて」で絞り込みを解除する

## 10. Google Drive動画

1. Google Driveへ動画をアップロードする。
2. 共有設定を「リンクを知っている全員が閲覧可」にする。
3. URLからファイルIDを取得する。
4. `videos.json` の `driveFileId` に登録する。
5. 詳細画面では次のURLを組み立てる。

```text
https://drive.google.com/file/d/{driveFileId}/preview
```

## 11. LINE共有

Google Drive URLではなく、サイトの動画詳細URLを共有する。

```text
https://social-plugins.line.me/lineit/share?url={詳細URL}
```

公開URLは変更しない。Cloudflare Pagesの本番ドメインまたは独自ドメインを継続利用する。

## 12. 動画追加手順

1. 動画をGoogle Driveへアップロードする。
2. サムネイルを1枚作成する。
3. `videos.json` に1件追加する。
4. ローカルで一覧、詳細、再生を確認する。
5. GitHubへpushし、Cloudflare Pagesへ反映する。

HTMLは動画追加のたびに変更しない。

## 13. 実装順

1. タグ重複バグを修正する。
2. お気に入り表記を「いいね」へ変更する。
3. 共通ナビゲーションを追加する。
4. 新着3本カルーセルを実装する。
5. TOPの新着・視聴数・いいね各TOP3を実装する。
6. 視聴数TOP5、いいねTOP5、全動画ページを実装する。
7. サムネイルを用意する。
8. Google Drive動画へ切り替える。
9. Cloudflare Pagesへ公開する。

## 14. 将来拡張

- 視聴数・いいね数の自動集計
- 動画別OGP
- 検索
- Cloudflare R2への動画移行
- 必要になった場合のみアクセス制限を追加
