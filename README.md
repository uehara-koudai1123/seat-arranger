# seat-arranger

クラスやチーム向けの、席替えを行うWebアプリ

## 機能

### 主催者機能
- Google OAuth (OIDC) によるログイン認証
- セッションの作成・一覧表示・編集
- セッションの複製（座席レイアウト+参加者名をコピー）
- 座席レイアウトの管理（座標とラベル）
- 参加者共有の有効/無効切り替え（isShareEnabled）
- 座席保存時の参加者提案警告

### 参加者機能
- ログイン不要での参加
- 公開URL（/s/:publicId）からのアクセス
- 名前入力による参加
- 座席配置案（layoutJson）の提出・更新
- isShareEnabled=OFFの場合は「準備中」画面を表示

## 技術スタック

- **フレームワーク**: React Router v7 (Remix v7 FM)
- **言語**: TypeScript
- **データベース**: PostgreSQL + Prisma ORM
- **認証**: remix-auth + remix-auth-oauth2 (Google OAuth)
- **セッション管理**: httpOnly cookie
- **デプロイ**: Vercel

## データモデル

- **Host**: 主催者（Google OAuth情報）
- **Session**: セッション（publicId, isShareEnabled）
- **Seat**: 座席（x, y, label）
- **Participant**: 参加者（name）
- **Proposal**: 配置案（layoutJson）

## セットアップ

### 前提条件

- Node.js 18以上
- PostgreSQL データベース
- Google OAuth クライアント ID とシークレット

### インストール

```bash
npm install
```

### 環境変数の設定

`.env.example`を`.env`にコピーして、以下の値を設定：

```bash
# データベース接続URL
DATABASE_URL="postgresql://user:password@localhost:5432/seat_arranger?schema=public"

# Google OAuth認証情報
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# セッションシークレット（ランダムな文字列）
SESSION_SECRET="your-session-secret-here"

# アプリケーションURL
APP_URL="http://localhost:5173"
```

### データベースのセットアップ

```bash
# Prismaクライアントの生成
npm run db:generate

# データベースのマイグレーション
npm run db:push
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:5173 にアクセス

## ビルドとデプロイ

### ビルド

```bash
npm run build
```

### 本番環境での起動

```bash
npm start
```

### Vercelへのデプロイ

1. Vercelプロジェクトを作成
2. 環境変数を設定（DATABASE_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SESSION_SECRET, APP_URL）
3. デプロイ

```bash
vercel
```

## 使い方

### 主催者として

1. トップページから「ログインして開始」をクリック
2. Googleアカウントでログイン
3. ダッシュボードで「新しいセッションを作成」
4. セッション情報と座席レイアウトを設定
5. 「参加者に公開する」をONにして公開URLを参加者に共有

### 参加者として

1. 主催者から共有された URL (/s/:publicId) にアクセス
2. 名前を入力して参加
3. 座席配置案をJSON形式で提出

## ライセンス

ISC
