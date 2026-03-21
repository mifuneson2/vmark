# Quanto custaria construir o VMark?

::: info Resumo
O VMark tem cerca de 109.000 linhas de código de produção e 206.000 linhas de código de teste em TypeScript, Rust, CSS e Vue. Uma equipe humana precisaria de **4.239 dias-desenvolvedor** (~17 pessoas-ano) para construí-lo do zero. A preços de mercado nos EUA, isso custaria **US$ 3,4–4,2 milhões**. Foi construído em **85 dias corridos** por uma única pessoa com assistência de IA, a um custo de aproximadamente **US$ 2.000** — um multiplicador de produtividade de ~50x e uma redução de custos de ~99,9%.
:::

## Por que esta página existe

Uma pergunta aparece o tempo todo: *"Quanto esforço o VMark realmente exigiu?"*

Esta não é uma página de marketing. É uma análise transparente e baseada em dados, usando métricas reais do código — não impressões. Todos os números aqui vêm do `tokei` (contagem de linhas), `git log` (histórico) e `vitest` (contagem de testes). Você pode reproduzir esses números clonando o repositório.

## Métricas brutas

| Métrica | Valor |
|---------|-------|
| Código de produção (frontend TS/TSX) | 85.306 LOC |
| Código de produção (backend Rust) | 10.328 LOC |
| Código de produção (servidor MCP) | 4.627 LOC |
| CSS de produção | 8.779 LOC |
| Dados i18n de localização | 10.130 LOC |
| Site (Vue + TS + documentação) | 4.421 LOC + 75.930 linhas de documentação |
| **Código de teste** | **206.077 LOC** (656 arquivos) |
| Quantidade de testes | 17.255 testes |
| Documentação | 75.930 linhas (320 páginas, 10 idiomas) |
| Commits | 1.993 em 84 dias ativos |
| Tempo corrido | 85 dias (27 dez 2025 — 21 mar 2026) |
| Colaboradores | 2 (1 humano + IA) |
| Taxa de reescrita | 3,7x (1,23M inserções / 330K linhas finais) |
| Proporção teste/produção | **2,06:1** |

### O que esses números significam

- **Proporção teste/produção de 2,06:1** — é excepcional. A maioria dos projetos open source fica em torno de 0,3:1. O VMark tem mais código de teste do que código de produção — o dobro.
- **Taxa de reescrita de 3,7x** — significa que, para cada linha no codebase final, 3,7 linhas foram escritas no total (incluindo reescritas, refatorações e código deletado). Isso indica iteração significativa — não "escreva uma vez e publique".
- **1.993 commits em 84 dias ativos** — uma média de ~24 commits por dia. O desenvolvimento assistido por IA produz muitos commits pequenos e focados.

## Análise de complexidade

Nem todo código é igual. Uma linha de parsing de configuração não é a mesma coisa que uma linha de código de plugin ProseMirror. O codebase é classificado em quatro níveis de complexidade:

| Nível | O que inclui | LOC | Ritmo (LOC/dia) |
|-------|--------------|-----|-----------------|
| **Rotina** (1,0x) | JSON i18n, tokens CSS, layouts de página, UI de configurações | 23.000 | 150 |
| **Padrão** (1,5x) | Stores, hooks, componentes, bridge MCP, exportação, comandos Rust, site | 52.000 | 100 |
| **Complexo** (2,5x) | Plugins ProseMirror/Tiptap (multicursor, modo foco, preview de código, UI de tabelas, guarda IME), integração CodeMirror, provider de IA Rust, servidor MCP | 30.000 | 50 |
| **Pesquisa** (4,0x) | Motor de formatação CJK, sistema de guarda de composição, auto-pair com reconhecimento IME | 4.000 | 25 |

Os ritmos "LOC/dia" consideram um desenvolvedor sênior escrevendo código testado e revisado — não saída bruta sem revisão.

### Por que plugins de editor são caros

A parte isoladamente mais cara do VMark é a **camada de plugins ProseMirror/Tiptap** — 34.859 linhas de código que gerenciam seleções de texto, transações de documento, node views e composição IME. Essa é amplamente considerada a categoria mais difícil do desenvolvimento web:

- Você trabalha com um modelo de documento, não com uma árvore de componentes
- Cada edição é uma transação que precisa preservar a integridade do documento
- A composição IME (para entrada CJK) adiciona uma máquina de estados paralela inteira
- O multicursor exige rastrear N seleções independentes simultaneamente
- O desfazer/refazer precisa funcionar corretamente em todos os pontos acima

É por isso que a camada de plugins é classificada como "Complexo" (multiplicador 2,5x) e o código CJK/IME como "Pesquisa" (4,0x).

## Estimativa de esforço

| Componente | LOC | Dias-desenvolvedor |
|------------|-----|--------------------|
| Nível 1 produção (rotina) | 23.000 | 153 |
| Nível 2 produção (padrão) | 52.000 | 520 |
| Nível 3 produção (complexo) | 30.000 | 600 |
| Nível 4 produção (pesquisa) | 4.000 | 160 |
| Código de teste | 206.077 | 1.374 |
| Documentação (10 idiomas) | 75.930 | 380 |
| **Subtotal** | | **3.187** |
| Overhead (design 5% + CI 3% + revisão 10%) | | 574 |
| Custo de reescrita (3,7x → +15%) | | 478 |
| **Total** | | **4.239 dias-desenvolvedor** |

Isso equivale a aproximadamente **17 pessoas-ano** de trabalho em tempo integral de engenharia sênior.

::: warning Nota sobre o esforço de testes
A suíte de testes (206K LOC, 17.255 testes) representa **1.374 dias-desenvolvedor** — mais de um terço do esforço total. Esse é o custo da disciplina test-first do projeto. Sem ela, o projeto custaria cerca de 40% menos para construir, mas seria significativamente mais difícil de manter.
:::

## Estimativa de custos

Usando tarifas de mercado nos EUA (custo total — salário + benefícios + overhead):

| Cenário | Equipe | Duração | Custo |
|---------|--------|---------|-------|
| Sênior solo ($800/dia) | 1 pessoa | 17,7 anos | **$3,39M** |
| Equipe pequena ($900/dia em média) | 3 pessoas | 2,3 anos | **$3,82M** |
| Equipe completa ($1.000/dia em média) | 5 pessoas | 10,6 meses | **$4,24M** |

Equipes não escalam linearmente. Uma equipe de 5 pessoas é ~4x mais produtiva que uma pessoa (não 5x) por causa do overhead de comunicação — é a Lei de Brooks em ação.

## A realidade da IA

| Métrica | Valor |
|---------|-------|
| Tempo corrido real | **85 dias** (12 semanas) |
| Equivalente humano | 4.239 dias-desenvolvedor (~17 pessoas-ano) |
| **Multiplicador de produtividade** | **~50x** |
| Custo real estimado | ~$2.000 (assinatura Claude Max) |
| Custo equivalente humano (solo) | $3,39M |
| **Redução de custos** | **~99,9%** |

### O que o multiplicador de 50x significa

**Não** significa "a IA é 50 vezes mais inteligente que um humano". Significa:

1. **A IA não troca de contexto.** Ela pode manter todo o codebase na memória e fazer alterações em 10 arquivos simultaneamente.
2. **A IA escreve testes na velocidade de produção.** Para um humano, escrever 17.255 testes é um trabalho exaustivo. Para a IA, é apenas mais código.
3. **A IA lida com boilerplate instantaneamente.** A camada de tradução em 10 idiomas (10.130 LOC de JSON + 320 páginas de documentação) levaria semanas para uma equipe humana. A IA faz em minutos.
4. **A IA não se entedia.** Os 656 arquivos de teste cobrindo casos extremos, composição IME e formatação CJK são exatamente o tipo de trabalho que humanos pulam.

O papel do humano foi o julgamento — *o que* construir, *quando* parar, *qual* abordagem seguir. O papel da IA foi o trabalho — escrever, testar, depurar, traduzir.

## Comparação com o mercado

| Dimensão | VMark | Typora | Zettlr | Mark Text |
|----------|-------|--------|--------|-----------|
| Função principal | Markdown WYSIWYG + Fonte | Markdown WYSIWYG | Markdown acadêmico | Markdown WYSIWYG |
| LOC (estimativa) | ~109K prod | ~200K (código fechado) | ~80K | ~120K |
| Colaboradores | 2 (1 humano + IA) | 1–2 (fechado) | ~50 | ~100 |
| Idade | **3 meses** | 8+ anos | 6+ anos | 6+ anos |
| Preço | Gratuito (beta) | $15 licença | Gratuito / OSS | Gratuito / OSS |
| Diferencial | Tauri nativo, MCP AI, CJK nativo, multicursor | Polimento, export PDF | Zettelkasten, citações | Electron, maduro |

### O que essa comparação mostra

O VMark atingiu um tamanho de codebase e um conjunto de funcionalidades comparáveis em **85 dias** — algo que outros projetos levaram **6–8 anos** para alcançar com equipes de 50–100 colaboradores. A disciplina de testes (17K testes, proporção 2:1) supera todos os editores markdown open source nesta comparação.

Isso não significa que o VMark é "melhor" — ele é mais novo e menos testado em batalha. Mas demonstra o que o desenvolvimento assistido por IA torna possível: uma única pessoa pode produzir um resultado que antes exigia uma equipe financiada.

## O que torna caro construir o VMark

Três fatores determinam o custo:

1. **Complexidade dos plugins do editor** — 34.859 LOC de plugins ProseMirror que lidam com seleção, transações, node views e composição IME. Trata-se de código de Nível 3/4 que um especialista sênior em frameworks de editor escreveria a ~50 LOC/dia.

2. **Disciplina de testes extrema** — Uma proporção teste/produção de 2,06:1 significa que o código de teste sozinho (206K LOC) demanda mais esforço que o código de produção. É um investimento deliberado — é o que torna o desenvolvimento assistido por IA sustentável.

3. **i18n completa em 10 idiomas** — 320 páginas de documentação, 80 arquivos JSON de localização e um site completamente traduzido. Essa é uma escala operacional normalmente vista em produtos comerciais financiados, não em projetos individuais.

## Reproduza esses números

Todas as métricas são reproduzíveis a partir do repositório público:

```bash
# Clonar e instalar
git clone https://github.com/xiaolai/vmark.git
cd vmark && pnpm install

# Métricas LOC (requer tokei: brew install tokei)
tokei --exclude node_modules --exclude dist .

# Histórico Git
git log --oneline | wc -l
git log --format='%ai' | awk '{print $1}' | sort -u | wc -l

# Contagem de testes
pnpm vitest run src/ 2>&1 | tail -5
```

::: tip Metodologia
As referências de produtividade (ritmos LOC/dia) usadas nesta análise são estimativas padrão da indústria para desenvolvedores seniores escrevendo código testado e revisado. Elas vêm da literatura de estimativa de software (McConnell, Capers Jones) e são calibradas para saída de qualidade de produção — não para protótipos ou código proof-of-concept.
:::
