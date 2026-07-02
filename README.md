# Video Log

海外を中心に、旅先の景色と音を残す軽量な動画ログ。

**公開サイト:** [https://video-shelf.pages.dev/](https://video-shelf.pages.dev/)

## 構成

- Cloudflare Pages: HTML、CSS、JavaScriptを公開
- Cloudflare R2: 再生用MP4を配信
- `data/videos.json`: タイトル、説明、日付、タグ、動画URLを管理
- Google Drive: 元動画のバックアップ（サイトの再生には不使用）

動画台帳はJSONで管理し、ログイン、管理画面、フレームワークは使用しない。動画の再生数だけはCloudflare D1へ保存し、一覧の人気順に使用する。動画を10秒以上再生した時点で、同じブラウザからは24時間に1回だけ記録する。

## ローカル起動

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

[http://127.0.0.1:4173/](http://127.0.0.1:4173/) を開く。

## 動画追加

1. MP4をCloudflare R2の `videos/` 以下へアップロードする。
2. `Content-Type: video/mp4` とRange配信を確認する。
3. サムネイルを `images/thumbnails/` へ追加する。
4. `data/videos.json` へ動画情報とR2公開URLを追加する。
5. `./scripts/check.sh` とローカル画面を確認する。
6. Pull Requestを作成し、CIを通して反映する。

## Cloudflare設定

### Web Analytics

PagesプロジェクトのMetricsからWeb Analyticsを有効化する。Cloudflareが次回デプロイ時にBeaconスクリプトを自動追加するため、HTMLへの直書きは不要。

### D1

`video-shelf-views` D1データベースと、変数名 `DB` の接続情報は `wrangler.jsonc` で管理する。スキーマ変更は `migrations/` に保存し、WranglerでリモートD1へ適用する。

ローカルの通常HTTPサーバーではD1 APIが存在しないが、画面は再生数0件として動作する。D1を含む確認にはWrangler Pages Devを使用する。

詳しい設計と運用は [docs/design.md](docs/design.md) を参照。
