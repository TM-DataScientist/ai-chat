# ============================================================
# AI Chat - Makefile
# ============================================================

# .env.local に GCP_PROJECT_ID=xxx を記載するか、make deploy PROJECT_ID=xxx で指定
PROJECT_ID ?= $(shell grep -s GCP_PROJECT_ID .env.local | cut -d= -f2)
REGION     ?= asia-northeast1
IMAGE      := gcr.io/$(PROJECT_ID)/ai-chat
SERVICE    := ai-chat

.PHONY: help init dev build start lint docker-build docker-run deploy wif-setup db-check

# デフォルトターゲット
help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "  init          依存関係のインストールと .env.local の初期化"
	@echo "  dev           開発サーバーを起動 (http://localhost:3000)"
	@echo "  build         本番用ビルド"
	@echo "  start         本番サーバーを起動"
	@echo "  lint          ESLint を実行"
	@echo "  docker-build  Docker イメージをビルド"
	@echo "  docker-run    Docker コンテナをローカルで起動"
	@echo "  deploy        Google Cloud Run にデプロイ"
	@echo "  wif-setup     GitHub Actions 用 Workload Identity Federation を設定"
	@echo "  db-check      MongoDB Atlas への接続を確認"
	@echo ""
	@echo "デプロイには .env.local に GCP_PROJECT_ID を設定してください:"
	@echo "  GCP_PROJECT_ID=my-gcp-project"
	@echo "または: make deploy PROJECT_ID=my-gcp-project"
	@echo ""
	@echo "WIF セットアップ（初回のみ）："
	@echo "  make wif-setup GITHUB_REPO=your-username/ai-chat"

# ------------------------------------------------------------
# 開発
# ------------------------------------------------------------

init:
	npm install
	@if [ ! -f .env.local ]; then \
		cp .env.local.example .env.local; \
		echo ".env.local を作成しました。OPENAI_API_KEY を設定してください。"; \
	else \
		echo ".env.local はすでに存在します。スキップします。"; \
	fi

dev:
	npm run dev

build:
	npm run build

start:
	npm run start

lint:
	npm run lint

# ------------------------------------------------------------
# Docker
# ------------------------------------------------------------

docker-build:
	docker build -t $(IMAGE) .

docker-run:
	docker run --rm -p 8080:8080 \
		--env-file .env.local \
		$(IMAGE)

# ------------------------------------------------------------
# Google Cloud Run デプロイ
# ------------------------------------------------------------

deploy:
	@if [ -z "$(PROJECT_ID)" ]; then \
		echo "エラー: PROJECT_ID が未設定です。"; \
		echo "  .env.local に GCP_PROJECT_ID=your-project-id を追記するか"; \
		echo "  make deploy PROJECT_ID=your-project-id と指定してください。"; \
		exit 1; \
	fi
	gcloud config set project $(PROJECT_ID)
	@TOKEN=$$(gcloud auth print-access-token) && \
		echo "$$TOKEN" | docker login -u oauth2accesstoken --password-stdin https://gcr.io
	docker build -t $(IMAGE) .
	docker push $(IMAGE)
	gcloud run deploy $(SERVICE) \
		--image $(IMAGE) \
		--platform managed \
		--region $(REGION) \
		--allow-unauthenticated \
		--min-instances 0 \
		--set-env-vars OPENAI_API_KEY=$$(grep OPENAI_API_KEY .env.local | cut -d= -f2),MONGODB_URI=$$(grep MONGODB_URI .env.local | cut -d= -f2-)

# ------------------------------------------------------------
# GitHub Actions WIF セットアップ
# ------------------------------------------------------------

# 使い方: make wif-setup GITHUB_REPO=your-username/ai-chat
wif-setup:
	@if [ -z "$(GITHUB_REPO)" ]; then \
		echo "エラー: GITHUB_REPO が未設定です。"; \
		echo "  make wif-setup GITHUB_REPO=your-username/ai-chat"; \
		exit 1; \
	fi
	GITHUB_REPO=$(GITHUB_REPO) bash scripts/setup-wif.sh

# ------------------------------------------------------------
# DB 接続確認
# ------------------------------------------------------------

db-check:
	@node -e " \
		require('dotenv').config({ path: '.env.local' }); \
		const { PrismaClient } = require('@prisma/client'); \
		const p = new PrismaClient(); \
		p.session.count().then(n => { \
			console.log('MongoDB Atlas: 接続成功 (sessions:', n, ')'); p.\$$disconnect(); process.exit(0); \
		}).catch(e => { console.error('接続失敗:', e.message); p.\$$disconnect(); process.exit(1); });"
