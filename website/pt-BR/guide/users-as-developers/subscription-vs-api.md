# Assinatura vs Preços de API

As ferramentas de codificação com IA oferecem dois métodos de autenticação: **planos de assinatura** e **chaves de API**. Para sessões de codificação sustentadas (vibe-coding), as assinaturas são dramaticamente mais baratas — frequentemente 10–30x menos do que o faturamento de API pelo mesmo trabalho.[^1]

## A Diferença de Custo

Uma sessão de codificação ativa típica usa centenas de milhares de tokens por hora. Veja como os custos se comparam:

### Claude Code

| Método | Custo | O que Você Obtém |
|--------|-------|-----------------|
| **Claude Max** (assinatura) | $100–200/mês | Uso ilimitado durante sessões de codificação |
| **Chave de API** (`ANTHROPIC_API_KEY`) | $600–2.000+/mês | Paga por token; uso intenso acumula rapidamente |

**Comando de autenticação:**
```bash
claude          # Login automático com assinatura Claude Max (recomendado)
```

### Codex CLI (OpenAI)

| Método | Custo | O que Você Obtém |
|--------|-------|-----------------|
| **ChatGPT Plus** (assinatura) | $20/mês | Uso moderado |
| **ChatGPT Pro** (assinatura) | $200/mês | Uso intenso |
| **Chave de API** (`OPENAI_API_KEY`) | $200–1.000+/mês | Paga por token |

**Comando de autenticação:**
```bash
codex login     # Login com assinatura ChatGPT (recomendado)
```

### Gemini CLI (Google)

| Método | Custo | O que Você Obtém |
|--------|-------|-----------------|
| **Nível gratuito** | $0 | Cota gratuita generosa |
| **Google One AI Premium** | ~$20/mês | Limites mais altos |
| **Chave de API** (`GEMINI_API_KEY`) | Variável | Paga por token |

**Comando de autenticação:**
```bash
gemini          # Login com conta Google (recomendado)
```

## Regra Geral

> **Assinatura = 10–30x mais barata** para sessões de codificação sustentadas.

A matemática é simples: uma assinatura oferece uma taxa mensal fixa, enquanto o faturamento de API cobra por token. Ferramentas de codificação com IA são extremamente ávidas por tokens — elas leem arquivos inteiros, geram blocos longos de código e iteram em múltiplas rodadas de edições. Um único recurso complexo pode consumir milhões de tokens.[^2]

## Quando Chaves de API Ainda Fazem Sentido

Chaves de API são a escolha certa para:

| Caso de Uso | Por quê |
|-------------|---------|
| **Pipelines de CI/CD** | Trabalhos automatizados que rodam brevemente e com pouca frequência |
| **Uso leve ou ocasional** | Algumas consultas por semana |
| **Acesso programático** | Scripts e integrações que chamam a API diretamente |
| **Faturamento de equipe/organização** | Faturamento centralizado através de painéis de uso de API |

Para sessões de codificação interativas — onde você vai e volta com a IA por horas — as assinaturas ganham no custo sempre.[^3]

## Configuração no VMark

O `AGENTS.md` do VMark impõe autenticação com preferência por assinatura como convenção do projeto. Quando você clona o repositório e abre uma ferramenta de codificação com IA, ela te lembra de usar autenticação por assinatura:

```
Prefer subscription auth over API keys for all AI coding tools.
```

Todas as três ferramentas funcionam imediatamente após a autenticação:

```bash
# Recomendado: autenticação por assinatura
claude              # Claude Code com Claude Max
codex login         # Codex CLI com ChatGPT Plus/Pro
gemini              # Gemini CLI com conta Google

# Alternativa: chaves de API
export ANTHROPIC_API_KEY=sk-...
export OPENAI_API_KEY=sk-...
export GEMINI_API_KEY=AI...
```

::: tip PATH para Apps GUI no macOS
Apps GUI do macOS (como terminais iniciados pelo Spotlight) têm um PATH mínimo. Se uma ferramenta funciona no seu terminal mas o Claude Code não consegue encontrá-la, certifique-se de que a localização do binário está no seu perfil de shell (`~/.zshrc` ou `~/.bashrc`).
:::

[^1]: Uma sessão intensiva típica de codificação com IA consome 50.000–100.000+ tokens por interação. Às taxas de API atuais (ex.: Claude Sonnet a $3/$15 por milhão de tokens de entrada/saída), usuários pesados relatam custos mensais de API de $200–$2.000+ — enquanto planos de assinatura têm um teto de $100–$200/mês para uso ilimitado. A disparidade cresce com a intensidade do uso: usuários leves podem ver custos semelhantes de qualquer forma, mas sessões sustentadas de vibe-coding tornam as assinaturas a escolha clara. Veja: [AI Development Tools Pricing Analysis](https://vladimirsiedykh.com/blog/ai-development-tools-pricing-analysis-claude-copilot-cursor-comparison-2025) (2025); [Claude Code Token Limits Guide](https://www.faros.ai/blog/claude-code-token-limits), Faros AI (2025).

[^2]: Agentes de codificação com IA consomem muito mais tokens do que simples interações de chat porque leem arquivos inteiros no contexto, geram edições multi-arquivo, executam loops iterativos de correção-teste e mantêm o histórico de conversação em sessões longas. Uma única implementação de recurso complexo pode envolver dezenas de chamadas de ferramentas, cada uma consumindo milhares de tokens. A janela de contexto em si se torna um driver de custo — janelas maiores permitem resultados melhores, mas multiplicam o uso de tokens. Veja: [The Real Cost of Vibe Coding](https://smarterarticles.co.uk/the-real-cost-of-vibe-coding-when-ai-over-delivers-on-your-dime) (2025).

[^3]: O setor de SaaS mais amplo tem se movido em direção a modelos de preços híbridos que combinam assinaturas fixas com componentes baseados em uso. Em 2023, 46% das empresas de SaaS adotaram preços baseados em uso, e as empresas que o usam relatam 137% de retenção líquida em dólares. No entanto, para ferramentas alimentadas por IA onde cada consulta consome computação perceptível, preços puramente baseados em uso expõem os usuários a custos imprevisíveis — razão pela qual as assinaturas de taxa fixa permanecem atraentes para usuários individuais pesados. Veja: [The State of SaaS Pricing Strategy](https://www.invespcro.com/blog/saas-pricing/) (2025); [The Evolution of Pricing Models for SaaS Companies](https://medium.com/bcgontech/the-evolution-of-pricing-models-for-saas-companies-6d017101d733), BCG (2024).
