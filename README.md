# Video Shelf（旅の記憶）

旅先でスマホで撮った動画を、撮りっぱなしにせず「棚」に並べて残すための、個人の旅動画ライブラリです。友人に見せたり、ダウンロードしてもらったりもできます。

**公開サイト:** [https://video-shelf.pages.dev/](https://video-shelf.pages.dev/)

## サイトの内容

- 動画は7本（札幌、石垣、上海、香港、マニラ、インドネシア、タイ）
- トップページ: 旅の地図（アジア・太平洋の輪郭マップ。ピンを選ぶとその場所の動画へ）、Sound & Movie（動画に使った曲から、開くたびにランダムで3曲）
- 動画ページ: 再生、「動画の詳細」（年月・説明・使用曲）、「令和どうぶつたちの感想」（うさぎ・トラ・ペンギン・フクロウ・ねこの5匹が感想を言っている）
- 使用曲ページ: 動画に使った曲をアーティスト別に紹介（選んだ理由つき、Apple Musicへのリンクあり）
- インタビューページ: 「令和どうぶつたちが聞く、このサイトの話」。どうぶつたちが作った人に、なんで作ったのかなどを聞いている

## 構成

- Cloudflare Pages: HTML、CSS、JavaScriptを公開
- Cloudflare R2: 再生用MP4を配信（バケット `video-log-media`）
- `data/videos.json`: タイトル、説明、日付、タグ、動画URL、使用曲を管理
- Google Drive: 元動画のバックアップ（サイトの再生には不使用）

DB、ログイン、管理画面、フレームワークは使用しない。

Cloudflare Web AnalyticsはPages側で有効化し、`_headers`でCSPなどのセキュリティ設定とサムネイルの長期キャッシュを管理する。

現在の画面構成、SPレイアウト、タグ絞り込みなどの実装状況は [docs/design.md](docs/design.md) の「画面構成」「現在の実装状況」に記載する。

## ローカル起動

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

[http://127.0.0.1:4173/](http://127.0.0.1:4173/) を開く。

## 動画追加

1. MP4をCloudflare R2の `videos/` 以下へアップロードする。
2. `Content-Type: video/mp4` とRange配信を確認する。
3. サムネイルを `images/thumbnails/` へ追加する。
4. 使用曲がある場合は、ジャケット画像を `images/music/` へ追加する。
5. `data/videos.json` へ動画情報とR2公開URL、使用曲を追加する。
6. `./scripts/check.sh` とローカル画面を確認する。
7. Pull Requestを作成し、CIを通して反映する。

詳しい設計と運用は [docs/design.md](docs/design.md) を参照。
