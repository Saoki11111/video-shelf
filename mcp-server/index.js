import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import * as fs from "fs/promises";
import { createReadStream } from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// .env から環境変数を読み込む
dotenv.config();

// ffmpeg-static のパスを設定
ffmpeg.setFfmpegPath(ffmpegPath);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

// R2 クライアントの初期化（環境変数がある場合のみ）
let s3Client = null;
function getS3Client() {
  if (s3Client) return s3Client;

  const {
    CLOUDFLARE_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
  } = process.env;

  if (!CLOUDFLARE_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error(
      "Cloudflare R2の接続情報が不足しています。環境変数 CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY を設定してください。"
    );
  }

  s3Client = new S3Client({
    endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
    region: "auto",
  });

  return s3Client;
}

// MCPサーバーの作成
const server = new Server(
  {
    name: "video-shelf-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 利用可能なツールの定義
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "generate_thumbnail",
        description: "動画ファイルから指定された秒数のフレームをサムネイル画像（WebP）として切り出します。",
        inputSchema: {
          type: "object",
          properties: {
            videoPath: {
              type: "string",
              description: "ローカル動画ファイルの絶対パス、またはプロジェクトルートからの相対パス",
            },
            outputPath: {
              type: "string",
              description: "保存するサムネイル画像の絶対パス、またはプロジェクトルートからの相対パス（例: images/thumbnails/xxx.webp）",
            },
            time: {
              type: "number",
              description: "切り出す動画の秒数 (デフォルト: 2秒)",
            },
          },
          required: ["videoPath", "outputPath"],
        },
      },
      {
        name: "upload_to_r2",
        description: "ローカルファイルをCloudflare R2バケットにアップロードします。",
        inputSchema: {
          type: "object",
          properties: {
            filePath: {
              type: "string",
              description: "アップロードするローカルファイルの絶対パス、またはプロジェクトルートからの相対パス",
            },
            destinationKey: {
              type: "string",
              description: "R2上の保存キー（例: videos/xxx.mp4 または images/thumbnails/xxx.webp）",
            },
          },
          required: ["filePath", "destinationKey"],
        },
      },
      {
        name: "register_video_data",
        description: "動画のメタデータを data/videos.json に登録し、新着順・表示順に並べ替えて保存します。",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "動画ID (例: 202607-hawaii)",
            },
            title: {
              type: "string",
              description: "動画のタイトル",
            },
            description: {
              type: "string",
              description: "動画の簡単な説明",
            },
            publishedAt: {
              type: "string",
              description: "旅行や撮影の年月（例: 2026-07-01）",
            },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "場所を表すタグ（例: ['ハワイ']）",
            },
            thumbnail: {
              type: "string",
              description: "サイト内でのサムネイル相対パス（例: images/thumbnails/202607-hawaii.webp）",
            },
            videoUrl: {
              type: "string",
              description: "R2配信用の公開動画URL",
            },
            driveFileId: {
              type: "string",
              description: "Google Driveの元動画ファイルID (任意)",
            },
          },
          required: ["id", "title", "description", "publishedAt", "tags", "thumbnail", "videoUrl"],
        },
      },
    ],
  };
});

// ツール実行時のハンドラー
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "generate_thumbnail") {
      const videoPath = path.isAbsolute(args.videoPath)
        ? args.videoPath
        : path.join(PROJECT_ROOT, args.videoPath);
      const outputPath = path.isAbsolute(args.outputPath)
        ? args.outputPath
        : path.join(PROJECT_ROOT, args.outputPath);

      // 出力先ディレクトリの作成
      await fs.mkdir(path.dirname(outputPath), { recursive: true });

      const time = args.time ?? 2;

      await new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .screenshots({
            timestamps: [time],
            filename: path.basename(outputPath),
            folder: path.dirname(outputPath),
            size: "1280x720",
          })
          .on("end", resolve)
          .on("error", (err) => {
            reject(new Error(`FFmpegエラー: ${err.message}`));
          });
      });

      return {
        content: [
          {
            type: "text",
            text: `サムネイル画像を正常に切り出しました: ${outputPath}`,
          },
        ],
      };
    }

    if (name === "upload_to_r2") {
      const filePath = path.isAbsolute(args.filePath)
        ? args.filePath
        : path.join(PROJECT_ROOT, args.filePath);
      const destinationKey = args.destinationKey;

      const bucketName = process.env.R2_BUCKET_NAME;
      if (!bucketName) {
        throw new Error("環境変数 R2_BUCKET_NAME が設定されていません。");
      }

      // ファイルの存在確認
      await fs.access(filePath);

      // 拡張子から MIME タイプの推測
      const ext = path.extname(filePath).toLowerCase();
      let contentType = "application/octet-stream";
      if (ext === ".mp4") contentType = "video/mp4";
      else if (ext === ".webp") contentType = "image/webp";
      else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
      else if (ext === ".png") contentType = "image/png";

      const client = getS3Client();
      const fileStream = createReadStream(filePath);

      // ファイルサイズの取得（S3に送信するため）
      const stats = await fs.stat(filePath);

      const uploadParams = {
        Bucket: bucketName,
        Key: destinationKey,
        Body: fileStream,
        ContentType: contentType,
        ContentLength: stats.size,
      };

      await client.send(new PutObjectCommand(uploadParams));

      // 公開URLの生成
      const publicBaseUrl =
        process.env.R2_PUBLIC_URL ||
        `https://${bucketName}.r2.dev`; // デフォルトフォールバック
      const publicUrl = `${publicBaseUrl.replace(/\/$/, "")}/${destinationKey}`;

      return {
        content: [
          {
            type: "text",
            text: `R2へのアップロードが完了しました。\n公開URL: ${publicUrl}`,
          },
        ],
      };
    }

    if (name === "register_video_data") {
      const jsonPath = path.join(PROJECT_ROOT, "data", "videos.json");
      let videos = [];

      try {
        const jsonContent = await fs.readFile(jsonPath, "utf-8");
        videos = JSON.parse(jsonContent);
      } catch (err) {
        // ファイルがないか破損している場合は新規作成
        videos = [];
      }

      const today = new Date().toISOString().split("T")[0];
      
      const newVideo = {
        id: args.id,
        title: args.title,
        description: args.description,
        publishedAt: args.publishedAt,
        addedAt: today,
        tags: args.tags,
        thumbnail: args.thumbnail,
        videoUrl: args.videoUrl,
        driveFileId: args.driveFileId || "",
        sortOrder: 1, // 初期設定、あとで並べ替え時に再配置
      };

      // 既存の同一IDがある場合は削除（上書き）
      videos = videos.filter((v) => v.id !== args.id);

      // リストに挿入
      videos.push(newVideo);

      // 表示順序（sortOrder）の再計算
      // addedAt がある場合は addedAt 降順、ない場合は publishedAt 降順
      videos.sort((a, b) => {
        const dateA = a.addedAt || a.publishedAt;
        const dateB = b.addedAt || b.publishedAt;
        return dateB.localeCompare(dateA); // 降順 (新しい順)
      });

      // sortOrder を 1 から再付与
      videos = videos.map((v, index) => ({
        ...v,
        sortOrder: index + 1,
      }));

      // JSON に保存
      await fs.writeFile(jsonPath, JSON.stringify(videos, null, 2), "utf-8");

      return {
        content: [
          {
            type: "text",
            text: `videos.jsonに動画メタデータを登録しました。\nID: ${args.id}\nタイトル: ${args.title}\nsortOrder: ${newVideo.sortOrder}`,
          },
        ],
      };
    }

    throw new Error(`不明なツールです: ${name}`);
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `エラーが発生しました: ${error.message}`,
        },
      ],
    };
  }
});

// Stdioトランスポートでサーバー起動
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Video Shelf MCP Server running on stdio");
}

run().catch((error) => {
  console.error("サーバー起動エラー:", error);
  process.exit(1);
});
