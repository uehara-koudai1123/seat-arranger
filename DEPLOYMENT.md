# Vercel デプロイメントガイド

このガイドでは、seat-arrangerアプリケーションをVercelにデプロイする手順を説明します。

## 事前準備

### 1. PostgreSQLデータベースの準備

Vercelで使用できるPostgreSQLデータベースを用意します。以下のいずれかのオプションを選択してください：

- **Vercel Postgres** (推奨): Vercelの統合されたPostgresサービス
- **Neon**: サーバーレスPostgresサービス
- **Supabase**: オープンソースのFirebase代替
- **その他**: Railway、Heroku Postgresなど

データベースのURLを控えておいてください（`postgresql://...`の形式）。

### 2. Google OAuth認証情報の取得

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成（または既存のプロジェクトを選択）
3. 「APIとサービス」→「認証情報」に移動
4. 「認証情報を作成」→「OAuthクライアントID」を選択
5. アプリケーションの種類: 「ウェブアプリケーション」を選択
6. 承認済みのリダイレクトURIを追加:
   - `https://your-app.vercel.app/auth/google/callback`
   - （開発用）`http://localhost:5173/auth/google/callback`
7. クライアントIDとクライアントシークレットを控えておく

### 3. セッションシークレットの生成

ランダムな文字列を生成します。以下のコマンドで生成できます：

```bash
openssl rand -base64 32
```

## Vercelへのデプロイ

### 方法1: Vercel CLIを使用

1. Vercel CLIをインストール:
```bash
npm install -g vercel
```

2. プロジェクトディレクトリでVercelにログイン:
```bash
vercel login
```

3. デプロイを実行:
```bash
vercel
```

4. 質問に答えてセットアップを完了

### 方法2: Vercel Dashboard（推奨）

1. [Vercel Dashboard](https://vercel.com/dashboard)にアクセス
2. 「New Project」をクリック
3. GitHubリポジトリをインポート
4. プロジェクト設定:
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`（デフォルトのまま）
   - **Output Directory**: `build/client`
   - **Install Command**: `npm install && npm run db:generate`

## 環境変数の設定

Vercel Dashboardで以下の環境変数を設定します：

### 必須の環境変数

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `DATABASE_URL` | PostgreSQL接続URL | `postgresql://user:pass@host/db` |
| `GOOGLE_CLIENT_ID` | Google OAuth クライアントID | `123456789.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth クライアントシークレット | `GOCSPX-xxx...` |
| `SESSION_SECRET` | セッション暗号化用シークレット | ランダムな32文字以上の文字列 |
| `APP_URL` | アプリケーションのURL | `https://your-app.vercel.app` |
| `NODE_ENV` | 環境 | `production` |

### 環境変数の設定手順

1. Vercel Dashboardでプロジェクトを開く
2. 「Settings」タブをクリック
3. サイドバーから「Environment Variables」を選択
4. 各環境変数を追加:
   - Key: 変数名を入力
   - Value: 値を入力
   - Environment: `Production`, `Preview`, `Development` を選択
5. 「Save」をクリック

## データベースのセットアップ

### Vercel Postgresを使用する場合

1. Vercel Dashboardでプロジェクトを開く
2. 「Storage」タブをクリック
3. 「Create Database」→「Postgres」を選択
4. データベース名を入力して作成
5. 「DATABASE_URL」が自動的に環境変数に追加されます

### 外部データベースを使用する場合

1. データベースプロバイダーでPostgreSQLインスタンスを作成
2. 接続URLを取得
3. Vercelの環境変数として `DATABASE_URL` を設定

## データベースマイグレーション

初回デプロイ後、データベースのスキーマを作成する必要があります：

### オプション1: Prisma Studio経由

```bash
# ローカル環境で実行
DATABASE_URL="your-production-database-url" npm run db:push
```

### オプション2: Vercel CLIで実行

```bash
vercel env pull .env.production
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2-) npm run db:push
```

## デプロイ後の確認

1. デプロイが完了したら、Vercelが提供するURLにアクセス
2. ホームページが正しく表示されることを確認
3. 「ログインして開始」をクリックしてGoogle認証をテスト
4. セッション作成と座席管理機能をテスト

## トラブルシューティング

### ビルドエラー

- `npm run build`がローカルで成功することを確認
- Vercelのビルドログを確認
- Node.jsのバージョンを確認（18以上が必要）

### データベース接続エラー

- `DATABASE_URL`が正しく設定されているか確認
- データベースがVercelからアクセス可能か確認
- IPホワイトリストの設定を確認（必要な場合）

### 認証エラー

- Google OAuthのリダイレクトURIが正しく設定されているか確認
- `GOOGLE_CLIENT_ID`と`GOOGLE_CLIENT_SECRET`が正しいか確認
- `APP_URL`が実際のVercel URLと一致しているか確認
- `SESSION_SECRET`が設定されているか確認

### Prismaエラー

- `npm run db:generate`が正しく実行されたか確認
- `installCommand`に`npm run db:generate`が含まれているか確認

## 継続的デプロイ

GitHubリポジトリに接続している場合、以下のブランチへのプッシュで自動的にデプロイされます：

- **main/masterブランチ**: 本番環境へデプロイ
- **その他のブランチ**: プレビュー環境へデプロイ

## カスタムドメインの設定

1. Vercel Dashboardでプロジェクトを開く
2. 「Settings」→「Domains」に移動
3. カスタムドメインを追加
4. DNSレコードを設定（Vercelの指示に従う）
5. 環境変数`APP_URL`をカスタムドメインに更新
6. Google OAuthのリダイレクトURIもカスタムドメインに更新

## セキュリティのベストプラクティス

1. **環境変数の保護**: 機密情報は必ず環境変数として設定
2. **SESSION_SECRET**: 十分に長くランダムな文字列を使用
3. **データベース**: 本番環境では強力なパスワードを使用
4. **HTTPS**: Vercelは自動的にHTTPSを有効化
5. **定期的な更新**: 依存関係を定期的に更新

## サポート

問題が発生した場合：

1. [Vercelのドキュメント](https://vercel.com/docs)を確認
2. [Prismaのドキュメント](https://www.prisma.io/docs)を確認
3. プロジェクトのIssueを作成
