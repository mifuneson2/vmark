# Baixar VMark

<script setup>
import DownloadButton from '../.vitepress/components/DownloadButton.vue'
</script>

<DownloadButton />

## Requisitos do Sistema

- macOS 10.15 (Catalina) ou posterior
- Processador Apple Silicon (M1/M2/M3) ou Intel
- 200 MB de espaço em disco

## Instalação

**Homebrew (Recomendado)**

```bash
brew install xiaolai/tap/vmark
```

Isso instala o VMark e seleciona automaticamente a versão correta para o seu Mac (Apple Silicon ou Intel).

**Atualização**

```bash
brew update && brew upgrade vmark
```

**Instalação Manual**

1. Baixe o arquivo `.dmg`
2. Abra o arquivo baixado
3. Arraste o VMark para a pasta Aplicativos
4. Na primeira execução, clique com o botão direito no app e selecione "Abrir" para contornar o Gatekeeper

## Windows e Linux

O VMark é construído com Tauri, que suporta compilação multiplataforma. No entanto, **o desenvolvimento ativo e os testes estão atualmente focados no macOS**. O suporte para Windows e Linux é limitado no futuro próximo devido a restrições de recursos.

Se você quiser executar o VMark no Windows ou Linux:

- **Binários pré-compilados** estão disponíveis no [GitHub Releases](https://github.com/xiaolai/vmark/releases) (fornecidos como estão, sem suporte garantido)
- **Compilar a partir do código-fonte** seguindo as instruções abaixo

## Verificando Downloads

Todas as versões são compiladas automaticamente via GitHub Actions. Você pode verificar a autenticidade conferindo a versão na nossa [página de Releases do GitHub](https://github.com/xiaolai/vmark/releases).

## Compilando a Partir do Código-Fonte

Para desenvolvedores que desejam compilar o VMark a partir do código-fonte:

```bash
# Clonar o repositório
git clone https://github.com/xiaolai/vmark.git
cd vmark

# Instalar dependências
pnpm install

# Compilar para produção
pnpm tauri build
```

Consulte o [README](https://github.com/xiaolai/vmark#readme) para instruções detalhadas de compilação e pré-requisitos.
