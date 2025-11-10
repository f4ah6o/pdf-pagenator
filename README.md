# PDF ページ番号付与 SPA

PDFファイルにページ番号を追加するWebアプリケーション（完全ブラウザ内処理）

## 機能

- PDFファイルにページ番号を追加
- ページ番号の位置を選択（ヘッダー / フッター）
- 寄せを選択（左 / 中央 / 右）
- 総ページ数の表示/非表示を選択
- フォントサイズの調整
- 完全にブラウザ内で処理（データの外部送信なし）

## 技術スタック

- React + TypeScript
- Vite
- pdf-lib
- pnpm
- Biome (linter & formatter)

## 開発

### セットアップ

```bash
pnpm install
```

### 開発サーバー起動

```bash
pnpm dev
```

### ビルド

```bash
pnpm build
```

### プレビュー

```bash
pnpm preview
```

### コードフォーマット

```bash
pnpm format
```

### リント

```bash
pnpm lint
```

## デプロイ

GitHub Pages に自動デプロイされます。

## ライセンス

MIT
