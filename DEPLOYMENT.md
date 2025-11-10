# GitHub Pages デプロイ設定

## 自動デプロイの設定方法

このプロジェクトを GitHub Pages にデプロイするには、以下の手順で GitHub Actions ワークフローを手動で追加してください。

### 1. ワークフローファイルを作成

リポジトリに以下のファイルを作成してください：

**`.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 2. GitHub Pages を有効化

1. リポジトリの Settings → Pages に移動
2. "Build and deployment" の "Source" を **GitHub Actions** に設定
3. main ブランチにマージすると自動でデプロイされます

### 3. ベース URL の確認

`vite.config.ts` の `base` オプションがリポジトリ名と一致していることを確認してください：

```typescript
export default defineConfig({
  plugins: [react()],
  base: '/pdf-pagenator/',  // ← リポジトリ名に合わせる
})
```

## 手動デプロイ

GitHub Actions を使わずに手動でデプロイする場合：

```bash
# ビルド
pnpm run build

# dist フォルダの内容を gh-pages ブランチにプッシュ
```
