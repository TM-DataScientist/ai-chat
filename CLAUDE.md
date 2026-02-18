# AI チャットボット 仕様書

## プロジェクト概要

個人利用向けの汎用AIチャットアシスタント。OpenAI GPT モデルを使用し、ChatGPT ライクな UI を持つ Web アプリ。

---

## 技術スタック

| カテゴリ | 技術 |
|---|---|
| フレームワーク | Next.js（App Router） |
| スタイリング | Tailwind CSS |
| API ルーティング | Hono（catch-all `app/api/[...route]/route.ts`） |
| AI フレームワーク | Mastra（`@mastra/core`） |
| AI モデル | OpenAI GPT（gpt-4o / gpt-4o-mini） |
| ORM | Prisma（MongoDB provider） |
| DB | MongoDB Atlas |
| マークダウン | react-markdown + rehype-highlight |
| コンテナ | Docker（Next.js standalone モード） |
| デプロイ | Google Cloud Run |

---

## 機能要件

### チャット機能
- ユーザーがメッセージを入力して送信できる
- AIの返答をストリーミングで表示する（文字が順番に流れてくる）
- 会話履歴はセッション単位で MongoDB に永続化（ページリロードで復元）
- Enterキーで送信、Shift+Enterで改行

### セッション管理
- サイドバーでセッション一覧を表示・切り替え
- セッションは新規作成・削除が可能
- セッションごとにモデル（gpt-4o / gpt-4o-mini）を記録

### モデル切り替え
- `gpt-4o` と `gpt-4o-mini` をUI上で切り替えられる
- 切り替えはヘッダーのセレクトボックスで操作

### マークダウン表示
- AIの返答をマークダウンとしてレンダリングする
- コードブロックはシンタックスハイライト付きで表示
- 箇条書き・見出し・太字なども正しく表示

---

## 非機能要件

- **デザイン**: ChatGPT ライクなシンプルなダークテーマ
- **レスポンシブ**: モバイルでも使用可能なレイアウト
- **APIキー管理**: `.env.local` に `OPENAI_API_KEY` と `MONGODB_URI` を記載してローカル管理

---

## 画面構成

```
┌──────────────────────────────────────────────┐
│  サイドバー          │  ヘッダー              │
│  [新しいチャット]    │  [AI Chat] [モデル▼]   │
│  ─────────────────  ├────────────────────────┤
│  セッション1         │                        │
│  セッション2         │  メッセージエリア        │
│  ...                │                        │
│                     │  ┌──────────────────┐  │
│                     │  │ User: こんにちは  │  │
│                     │  └──────────────────┘  │
│                     │                        │
│                     │  ┌──────────────────┐  │
│                     │  │ AI: こんにちは！  │  │
│                     │  └──────────────────┘  │
│                     │                        │
│                     ├────────────────────────┤
│                     │  入力エリア             │
│                     │  [テキストエリア] [送信] │
└──────────────────────────────────────────────┘
```

---

## ディレクトリ構成

```
ai-chat/
├── app/
│   ├── api/
│   │   └── [...route]/
│   │       └── route.ts       # Hono catch-all（全 API を一元管理）
│   ├── layout.tsx
│   └── page.tsx               # メイン画面
├── components/
│   ├── Chat.tsx               # チャット全体のコンテナ（セッション管理）
│   ├── MessageList.tsx        # メッセージ一覧
│   ├── MessageBubble.tsx      # 個別メッセージ（マークダウン対応）
│   ├── InputArea.tsx          # テキスト入力 + 送信ボタン
│   ├── ModelSelector.tsx      # モデル切り替えセレクトボックス
│   └── Sidebar.tsx            # セッション履歴サイドバー
├── lib/
│   ├── mastra.ts              # Mastra Agent 定義（gpt-4o / gpt-4o-mini）
│   ├── prisma.ts              # Prisma Client シングルトン
│   └── types/
│       └── session.ts         # TypeScript 型定義
├── prisma/
│   └── schema.prisma          # MongoDB provider スキーマ
├── .env.local                 # OPENAI_API_KEY + MONGODB_URI（git管理外）
├── .gitignore
├── .dockerignore
├── Dockerfile
├── next.config.ts
├── tailwind.config.ts
├── package.json
└── CLAUDE.md
```

---

## 環境変数

`.env.local` に以下を設定する：

```
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/ai-chat?retryWrites=true&w=majority
```

---

## APIエンドポイント

すべて `app/api/[...route]/route.ts`（Hono）で一元管理。

### `POST /api/chat`
Mastra Agent によるストリーミング応答。

**リクエスト:**
```json
{
  "messages": [{ "role": "user", "content": "こんにちは" }],
  "model": "gpt-4o-mini"
}
```
**レスポンス:** プレーンテキストストリーム（`text/plain; charset=utf-8`）

---

### `GET /api/sessions`
セッション一覧取得（messages 除外）。

### `POST /api/sessions`
新規セッション作成。

**リクエスト:** `{ "title": "string", "model": "gpt-4o-mini" }`

### `GET /api/sessions/:id`
セッション詳細取得（messages 含む）。

### `DELETE /api/sessions/:id`
セッション削除。

### `POST /api/sessions/:id/messages`
ストリーミング完了後にメッセージを一括保存。

---

## 開発・デプロイ手順

### ローカル開発

```bash
npm install
cp .env.local.example .env.local  # OPENAI_API_KEY と MONGODB_URI を設定
npm run dev
# http://localhost:3000 で確認
```

### Google Cloud Run デプロイ

```bash
# 1. Google Cloud プロジェクト設定
gcloud config set project YOUR_PROJECT_ID

# 2. Artifact Registry にイメージをビルド＆プッシュ
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/ai-chat

# 3. Cloud Run にデプロイ（OPENAI_API_KEY と MONGODB_URI の両方が必要）
gcloud run deploy ai-chat \
  --image gcr.io/YOUR_PROJECT_ID/ai-chat \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars OPENAI_API_KEY=sk-xxxx,MONGODB_URI=mongodb+srv://...
```

---

## 開発上の注意事項

- `OPENAI_API_KEY` と `MONGODB_URI` は絶対に git にコミットしない（`.gitignore` に `.env.local` を含める）
- API Route はサーバーサイドで動作するため、APIキーはクライアントに漏れない
- ストリーミングは Mastra の `agent.stream()` → `result.textStream` を使用
- すべての API エンドポイントは Hono で `app/api/[...route]/route.ts` に集約（`export const runtime = 'nodejs'` が必須）
- Prisma Client はシングルトンで管理し、コールドスタート時の多重生成を防ぐ
- モデル選択の状態は React の `useState` で管理（セッション内で保持）
- `npm run build` で `prisma generate` → `next build` の順に実行される
- Cloud Run デプロイ時は `next.config.ts` に `output: 'standalone'` が必須
- Cloud Run はリクエスト時に `PORT` 環境変数（デフォルト 8080）を注入する
