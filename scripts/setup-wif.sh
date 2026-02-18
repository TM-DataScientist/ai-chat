#!/usr/bin/env bash
# ============================================================
# Workload Identity Federation (WIF) セットアップスクリプト
#
# 使い方:
#   GITHUB_REPO=your-username/ai-chat bash scripts/setup-wif.sh
#
# 前提条件:
#   - gcloud CLI がインストール済み・認証済み
#   - .env.local に GCP_PROJECT_ID が設定済み
# ============================================================

set -euo pipefail

# -------------------------------------------------------
# 設定
# -------------------------------------------------------
PROJECT_ID="${GCP_PROJECT_ID:-$(grep -s GCP_PROJECT_ID .env.local | cut -d= -f2)}"
GITHUB_REPO="${GITHUB_REPO:-}"          # 例: your-username/ai-chat
SA_NAME="github-actions"
POOL_ID="github-actions-pool"
PROVIDER_ID="github-actions-provider"
REGION="asia-northeast1"

# -------------------------------------------------------
# バリデーション
# -------------------------------------------------------
if [ -z "$PROJECT_ID" ]; then
  echo "エラー: GCP_PROJECT_ID が未設定です。"
  echo "  .env.local に GCP_PROJECT_ID=your-project-id を設定するか"
  echo "  GCP_PROJECT_ID=your-project-id bash scripts/setup-wif.sh を実行してください。"
  exit 1
fi

if [ -z "$GITHUB_REPO" ]; then
  echo "エラー: GITHUB_REPO が未設定です。"
  echo "  GITHUB_REPO=your-username/ai-chat bash scripts/setup-wif.sh を実行してください。"
  exit 1
fi

SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "========================================"
echo "  WIF セットアップ"
echo "  Project  : $PROJECT_ID"
echo "  GitHub   : $GITHUB_REPO"
echo "  SA Email : $SA_EMAIL"
echo "========================================"

# -------------------------------------------------------
# 1. プロジェクト設定
# -------------------------------------------------------
echo ""
echo "[1/6] GCP プロジェクトを設定..."
gcloud config set project "$PROJECT_ID"

# 必要な API を有効化
gcloud services enable \
  iam.googleapis.com \
  cloudresourcemanager.googleapis.com \
  run.googleapis.com \
  containerregistry.googleapis.com \
  --quiet

# -------------------------------------------------------
# 2. サービスアカウント作成
# -------------------------------------------------------
echo ""
echo "[2/6] サービスアカウントを作成..."
if gcloud iam service-accounts describe "$SA_EMAIL" --quiet 2>/dev/null; then
  echo "  サービスアカウントはすでに存在します。スキップします。"
else
  gcloud iam service-accounts create "$SA_NAME" \
    --display-name "GitHub Actions (ai-chat)"
fi

# -------------------------------------------------------
# 3. IAM ロールを付与
# -------------------------------------------------------
echo ""
echo "[3/6] IAM ロールを付与..."
for ROLE in \
  roles/run.admin \
  roles/storage.objectAdmin \
  roles/iam.serviceAccountUser \
  roles/artifactregistry.writer; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member "serviceAccount:$SA_EMAIL" \
    --role "$ROLE" \
    --quiet
done

# -------------------------------------------------------
# 4. Workload Identity Pool 作成
# -------------------------------------------------------
echo ""
echo "[4/6] Workload Identity Pool を作成..."
if gcloud iam workload-identity-pools describe "$POOL_ID" \
  --location global --quiet 2>/dev/null; then
  echo "  Pool はすでに存在します。スキップします。"
else
  gcloud iam workload-identity-pools create "$POOL_ID" \
    --location global \
    --display-name "GitHub Actions Pool"
fi

POOL_NAME=$(gcloud iam workload-identity-pools describe "$POOL_ID" \
  --location global \
  --format "value(name)")

# -------------------------------------------------------
# 5. OIDC プロバイダー作成
# -------------------------------------------------------
echo ""
echo "[5/6] OIDC プロバイダーを作成..."
if gcloud iam workload-identity-pools providers describe "$PROVIDER_ID" \
  --workload-identity-pool "$POOL_ID" \
  --location global --quiet 2>/dev/null; then
  echo "  Provider はすでに存在します。スキップします。"
else
  gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_ID" \
    --workload-identity-pool "$POOL_ID" \
    --location global \
    --issuer-uri "https://token.actions.githubusercontent.com" \
    --attribute-mapping "google.subject=assertion.sub,attribute.repository=assertion.repository" \
    --attribute-condition "assertion.repository=='${GITHUB_REPO}'"
fi

PROVIDER_NAME=$(gcloud iam workload-identity-pools providers describe "$PROVIDER_ID" \
  --workload-identity-pool "$POOL_ID" \
  --location global \
  --format "value(name)")

# -------------------------------------------------------
# 6. サービスアカウントに WIF バインドを追加
# -------------------------------------------------------
echo ""
echo "[6/6] WIF バインドを設定..."
gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
  --role "roles/iam.workloadIdentityUser" \
  --member "principalSet://iam.googleapis.com/${POOL_NAME}/attribute.repository/${GITHUB_REPO}" \
  --quiet

# -------------------------------------------------------
# 完了メッセージ
# -------------------------------------------------------
echo ""
echo "========================================"
echo "  セットアップ完了！"
echo ""
echo "  GitHub リポジトリの Settings → Secrets and variables → Actions"
echo "  に以下のシークレットを登録してください："
echo ""
echo "  GCP_PROJECT_ID     = ${PROJECT_ID}"
echo "  WIF_PROVIDER       = ${PROVIDER_NAME}"
echo "  WIF_SERVICE_ACCOUNT= ${SA_EMAIL}"
echo "  OPENAI_API_KEY     = (your OpenAI API key)"
echo "  MONGODB_URI        = (your MongoDB Atlas URI)"
echo "========================================"
