# VMark をダウンロード

<script setup>
import DownloadButton from '../.vitepress/components/DownloadButton.vue'
</script>

<DownloadButton />

## システム要件

- macOS 10.15 (Catalina) 以降
- Apple Silicon (M1/M2/M3) または Intel プロセッサ
- 200 MB のディスクスペース

## インストール

**Homebrew（推奨）**

```bash
brew install xiaolai/tap/vmark
```

これにより VMark がインストールされ、お使いの Mac（Apple Silicon または Intel）に適したバージョンが自動的に選択されます。

**アップグレード**

```bash
brew update && brew upgrade vmark
```

**手動インストール**

1. `.dmg` ファイルをダウンロードする
2. ダウンロードしたファイルを開く
3. VMark をアプリケーションフォルダにドラッグする
4. 初回起動時は、アプリを右クリックして「開く」を選択し、Gatekeeper をバイパスする

## Windows & Linux

VMark は Tauri で構築されており、クロスプラットフォームコンパイルをサポートしています。ただし、**現在アクティブな開発とテストは macOS に集中しています**。リソースの制約により、Windows と Linux のサポートは当面限定的です。

Windows または Linux で VMark を実行したい場合：

- **ビルド済みバイナリ**は[GitHub Releases](https://github.com/xiaolai/vmark/releases)で入手可能です（サポートの保証なしで提供）
- **ソースからビルド**する場合は以下の手順に従ってください

## ダウンロードの確認

すべてのリリースは GitHub Actions を通じて自動的にビルドされます。[GitHub Releases ページ](https://github.com/xiaolai/vmark/releases)でリリースを確認することで、真正性を検証できます。

## ソースからビルド

ソースから VMark をビルドしたい開発者向け：

```bash
# リポジトリをクローン
git clone https://github.com/xiaolai/vmark.git
cd vmark

# 依存関係をインストール
pnpm install

# プロダクション向けにビルド
pnpm tauri build
```

詳細なビルド手順と前提条件については[README](https://github.com/xiaolai/vmark#readme)を参照してください。
