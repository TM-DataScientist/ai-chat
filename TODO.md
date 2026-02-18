# AI チャットボット 実装 TODO

## Phase 1: プロジェクト初期化

- [x] 1-1. Next.js プロジェクト作成
  ```bash
  npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --yes
  ```
- [x] 1-2. 追加パッケージのインストール
  ```bash
  npm install ai openai react-markdown rehype-highlight remark-gfm
  ```
- [x] 1-3. `.env.local.example` を作成（APIキーはユーザーが `.env.local` にコピーして設定）
- [x] 1-4. `.gitignore` に `.env.local` が含まれていることを確認

---

## Phase 2: バックエンド（API ルート）

- [x] 2-1. `app/api/chat/route.ts` を作成
  - Vercel AI SDK の `streamText` を使用
  - リクエストから `messages` と `model` を受け取る
  - OpenAI にストリーミングリクエストを送信して返す

---

## Phase 3: コンポーネント実装

- [x] 3-1. `components/ModelSelector.tsx`
  - `gpt-4o` / `gpt-4o-mini` を切り替えるセレクトボックス
  - 選択中のモデルを親コンポーネントに通知

- [x] 3-2. `components/MessageBubble.tsx`
  - ユーザー / AI のメッセージを表示
  - AI メッセージは `react-markdown` でレンダリング
  - コードブロックはシンタックスハイライト付き

- [x] 3-3. `components/MessageList.tsx`
  - メッセージの一覧表示
  - 新しいメッセージが来たら自動スクロール

- [x] 3-4. `components/InputArea.tsx`
  - テキストエリア（複数行対応）
  - Enter で送信 / Shift+Enter で改行
  - 送信中はローディング表示・入力無効化

- [x] 3-5. `components/Chat.tsx`
  - AI SDK の `useChat` フックで状態管理
  - 選択中のモデルを API に渡す
  - 各コンポーネントを組み合わせる

---

## Phase 4: ページ・レイアウト

- [x] 4-1. `app/layout.tsx` を更新
  - ダークテーマのベーススタイルを設定

- [x] 4-2. `app/page.tsx` を更新
  - `Chat` コンポーネントを配置

- [x] 4-3. `app/globals.css` でダークテーマの基本スタイル調整
  - スクロールバーをダークテーマに合わせる
  - マークダウン内のリスト・見出しスタイルを定義

---

## Phase 5: 動作確認・仕上げ

- [x] 5-1. ローカルで起動して動作確認
  ```bash
  npm run dev
  ```
- [ ] 5-2. ストリーミング表示の確認（ブラウザで手動確認）
- [ ] 5-3. モデル切り替えの確認（ブラウザで手動確認）
- [ ] 5-4. マークダウン・コードブロック表示の確認（ブラウザで手動確認）
- [x] 5-5. `next.config.ts` に `output: 'standalone'` を追加
- [x] 5-6. `Dockerfile` と `.dockerignore` を作成
- [ ] 5-7. Google Cloud Run にデプロイ
  - GitHub にプッシュ
  - `gcloud builds submit` でイメージをビルド＆プッシュ
  - `gcloud run deploy` でデプロイ
  - Cloud Run の環境変数に `OPENAI_API_KEY` と `MONGODB_URI` を設定
  - デプロイ後の URL で動作確認

---

## Phase 6: Hono + Prisma + Mastra 移行後の対応

> Phase 2 のバックエンドを Hono / Prisma（MongoDB Atlas）/ Mastra に置き換えた。
> 以下は移行後に残っている未対応タスク。

### 🔴 Critical（デプロイ前に必須）

- [x] 6-1. `next.config.ts` に `output: 'standalone'` を追加
  - Dockerfile の runner ステージが `.next/standalone` を参照しているため、これがないと Docker ビルドが壊れる
  ```ts
  // next.config.ts
  const nextConfig: NextConfig = { output: 'standalone' }
  ```

- [x] 6-2. `package.json` の build スクリプトに `prisma generate` を追加
  - Docker ビルド（builder ステージ）で `npm run build` を呼ぶ際、Prisma Client が生成されていないと実行時エラーになる
  - `schema.prisma` は builder ステージで `COPY . .` されるため、generate はビルド時に実行可能
  ```json
  "build": "prisma generate && next build"
  ```

### 🟡 Important（動作確認）

- [ ] 6-3. 新アーキテクチャでのブラウザ動作確認
  - `npm run dev` で起動し、以下をすべて確認する
  - [ ] 新規チャット作成 → Mastra Agent によるストリーミング表示
  - [ ] モデル切り替え（gpt-4o / gpt-4o-mini）
  - [ ] メッセージ送信後に MongoDB Atlas の `sessions` コレクションにドキュメントが保存されること
  - [ ] ページリロード後に最新セッションが自動復元されること
  - [ ] セッション削除が正しく動作すること

- [ ] 6-4. Cloud Run デプロイ時の環境変数を確認（5-7 と同時対応）
  - `OPENAI_API_KEY` に加え `MONGODB_URI` の設定が必要（旧来の `OPENAI_API_KEY` のみでは起動しない）
  ```bash
  gcloud run deploy ai-chat \
    --set-env-vars OPENAI_API_KEY=sk-xxxx,MONGODB_URI=mongodb+srv://...
  ```

### 🟢 Minor（任意対応）

- [x] 6-5. `CLAUDE.md` を現行アーキテクチャに更新
  - API ルートの記載を `app/api/[...route]/route.ts`（Hono catch-all）に変更
  - 技術スタック欄に Hono / Prisma / Mastra を追記、Mongoose を削除
  - ディレクトリ構成の図を現行に合わせる

- [x] 6-6. `@ai-sdk/react` の依存を整理
  - `Chat.tsx` は `useChat` を使わず独自 fetch でストリーミングを実装している
  - `@ai-sdk/react` は実質未使用なので `npm uninstall @ai-sdk/react` で削除済み

---

## ファイル構成（現行：Hono + Prisma + Mastra 移行後）

```
ai-chat/
├── app/
│   ├── api/
│   │   └── [...route]/
│   │       └── route.ts   ← Hono catch-all（全 API を一元管理）
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── Chat.tsx
│   ├── InputArea.tsx
│   ├── MessageBubble.tsx
│   ├── MessageList.tsx
│   ├── ModelSelector.tsx
│   └── Sidebar.tsx
├── lib/
│   ├── mastra.ts          ← Mastra Agent 定義（gpt-4o / gpt-4o-mini）
│   ├── prisma.ts          ← Prisma Client シングルトン
│   └── types/
│       └── session.ts
├── prisma/
│   └── schema.prisma      ← MongoDB provider（Session + Message 埋め込み型）
├── .env.local             # git管理外（OPENAI_API_KEY + MONGODB_URI）
├── .env.local.example
├── .gitignore
├── .dockerignore
├── Dockerfile
├── CLAUDE.md
├── TODO.md
├── next.config.ts
├── tailwind.config.ts
└── package.json
```
