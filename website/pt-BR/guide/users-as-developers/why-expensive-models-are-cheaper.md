# Por que Modelos Caros São Mais Baratos

::: info TL;DR
O modelo de IA mais capaz é **60% mais barato por tarefa**, apesar de custar 67% mais por token — porque usa menos tokens, precisa de menos iterações e produz 50–75% menos erros. Para quem vibe-codifica sem ler código, a qualidade do modelo não é sobre eficiência — é a única rede de segurança em todo o pipeline.
:::

::: details Última verificação: Fevereiro de 2026
As pontuações de benchmark, nomes de modelos e preços neste artigo refletem o estado do campo em fevereiro de 2026. O argumento central — que o custo por tarefa importa mais do que o preço por token — é duradouro mesmo conforme os números específicos mudam.
:::

O modelo de codificação com IA mais caro é quase sempre a opção mais barata — quando você mede o que realmente importa. O preço por token é uma distração. O que determina seu custo real é **quantos tokens são necessários para concluir o trabalho**, quantas iterações você queima e quanto do seu tempo vai para revisar e corrigir a saída.

## A Ilusão de Preço

Aqui estão os preços de API para os modelos Claude:

| Modelo | Entrada (por 1M tokens) | Saída (por 1M tokens) |
|--------|------------------------|----------------------|
| Claude Opus 4.5 | $5 | $25 |
| Claude Sonnet 4.5 | $3 | $15 |

O Opus parece 67% mais caro. A maioria das pessoas para aqui e escolhe o Sonnet. Essa é a matemática errada.

### O que Realmente Acontece

Os benchmarks da Anthropic contam uma história diferente. Com esforço médio, o Opus 4.5 **iguala** a melhor pontuação do Sonnet 4.5 no SWE-bench usando **76% menos tokens de saída**. Com o esforço máximo, o Opus **supera** o Sonnet em 4,3 pontos percentuais usando **48% menos tokens**.[^1]

Vamos fazer a matemática real:

| | Sonnet 4.5 | Opus 4.5 |
|--|-----------|----------|
| Tokens de saída por tarefa | ~500 | ~120 |
| Preço por 1M tokens de saída | $15 | $25 |
| **Custo por tarefa** | **$0,0075** | **$0,0030** |

O Opus é **60% mais barato por tarefa** — apesar de custar 67% mais por token.[^2]

Este não é um exemplo selecionado a dedo. Em tarefas de codificação de longo horizonte, o Opus alcança taxas de aprovação mais altas enquanto usa **até 65% menos tokens** e faz **50% menos chamadas de ferramentas**.[^1]

## O Imposto de Iteração

O custo de tokens é apenas parte da história. O custo maior são as **iterações** — quantas rodadas de gerar-revisar-corrigir são necessárias para obter código correto.

O Opus 4.5 atinge o desempenho máximo em **4 iterações**. Modelos concorrentes exigem **até 10 tentativas** para alcançar qualidade semelhante.[^1] Cada iteração falha te custa:

- **Tokens** — o modelo lê o contexto e gera novamente
- **Tempo** — você revisa a saída, encontra o problema, re-prompta
- **Atenção** — alternância de contexto entre "isso está certo?" e "o que está errado?"

A uma taxa de desenvolvedor de $75/hora, cada iteração falha que leva 15 minutos para revisar e corrigir custa **$18,75** em tempo humano. Seis iterações extras (a lacuna entre 4 e 10) custam **$112,50** em tempo de desenvolvedor — por tarefa complexa. A diferença de custo em tokens? Cerca de meio centavo.[^3]

**As economias de tempo do desenvolvedor são 22.500 vezes maiores do que a diferença de custo em tokens.**

## O Multiplicador de Erros

Modelos mais baratos não apenas precisam de mais iterações — eles produzem mais erros que chegam à produção.

O Opus 4.5 mostra uma **redução de 50–75%** tanto em erros de chamada de ferramentas quanto em erros de build/lint em comparação com outros modelos.[^1] Isso importa porque erros que escapam da sessão de codificação se tornam dramaticamente mais caros à medida que avançam:

- Um bug detectado durante a codificação custa minutos para corrigir
- Um bug detectado em revisão de código custa uma hora (sua + a do revisor)
- Um bug detectado em produção custa dias (depuração, hotfix, comunicação, post-mortem)

O estudo da Faros AI — cobrindo 1.255 equipes e mais de 10.000 desenvolvedores — descobriu que alta adoção de IA correlacionou com um **aumento de 9% em bugs por desenvolvedor** e um **aumento de 91% no tempo de revisão de PR**.[^4] Quando a IA gera mais código com menor precisão, o gargalo de revisão absorve completamente os ganhos de "produtividade".

Um modelo que acerta na primeira passagem evita esse efeito cascata.

## A Evidência do SWE-bench

O SWE-bench Verified é o padrão da indústria para avaliar a capacidade de codificação com IA em tarefas reais de engenharia de software. O leaderboard de fevereiro de 2026:[^5]

| Modelo | SWE-bench Verified |
|--------|-------------------|
| Claude Opus 4.5 | **80,9%** |
| Claude Opus 4.6 | 80,8% |
| GPT-5.2 | 80,0% |
| Gemini 3 Flash | 78,0% |
| Claude Sonnet 4.5 | 77,2% |
| Gemini 3 Pro | 76,2% |

Uma lacuna de 3,7 pontos entre o Opus 4.5 e o Sonnet 4.5 significa que o Opus resolve **aproximadamente 1 em cada 27 tarefas adicionais** que o Sonnet falha. Quando cada uma dessas falhas aciona uma sessão de depuração manual, o custo se acumula rapidamente.

Mas aqui está o ponto crucial — quando os pesquisadores mediram o **custo por tarefa resolvida** em vez do custo por token, o Opus era mais barato do que o Sonnet:

| Modelo | Custo Por Tarefa | Pontuação SWE-bench |
|--------|-----------------|---------------------|
| Claude Opus 4.5 | ~$0,44 | 80,9% |
| Claude Sonnet 4.5 | ~$0,50 | 77,2% |

O Sonnet custa **mais por tarefa** enquanto resolve **menos tarefas**.[^6]

## Codex CLI: O Mesmo Padrão, Fornecedor Diferente

O Codex CLI da OpenAI mostra a mesma dinâmica com níveis de esforço de raciocínio:

- **Raciocínio médio**: Velocidade e inteligência equilibradas — o padrão
- **Raciocínio extra-alto (xhigh)**: Pensa mais, produz respostas melhores — recomendado para tarefas difíceis

O GPT-5.1-Codex-Max com esforço médio supera o GPT-5.1-Codex padrão no mesmo esforço enquanto usa **30% menos tokens de raciocínio**.[^7] O modelo premium é mais eficiente em tokens porque raciocina melhor — não precisa gerar tantos passos intermediários para chegar à resposta certa.

O padrão é universal entre fornecedores: **modelos mais inteligentes desperdiçam menos computação.**

## O Aviso do METR

O ensaio controlado randomizado do METR fornece um conto cauteloso crucial. Dezesseis desenvolvedores experientes ($150/hora) receberam 246 tarefas com ferramentas de IA. O resultado: os desenvolvedores foram **19% mais lentos** com assistência de IA. Ainda mais impressionante — os desenvolvedores *acreditavam* que eram 20% mais rápidos, uma lacuna de percepção de quase 39 pontos percentuais.[^8]

O estudo usou **modelos da classe Sonnet** (Claude 3.5/3.7 Sonnet via Cursor Pro), não Opus. Menos de 44% do código gerado por IA foi aceito.

Isso sugere que o limiar de qualidade importa enormemente. Um modelo que produz código que você aceita 44% das vezes te torna mais lento — você gasta mais tempo revisando e rejeitando do que economiza. Um modelo com 50–75% menos erros e uma precisão dramaticamente maior na primeira passagem poderia inverter completamente essa equação.

**O estudo do METR não mostra que as ferramentas de codificação com IA são lentas. Ele mostra que as ferramentas de codificação com IA medíocres são lentas.**

## Dívida Técnica: Os 75% que Você Não Está Contando

O custo inicial de escrever código é apenas **15–25% do custo total de software** ao longo do seu ciclo de vida. Os **75–85%** restantes vão para manutenção, operações e correção de bugs.[^9]

A análise da GitClear sobre código produzido durante 2020–2024 encontrou um **aumento de 8x em blocos de código duplicados** e um **aumento de 2x em rotatividade de código** correlacionando com a adoção de ferramentas de IA. A SonarSource encontrou um **aumento de 93% em bugs de nível BLOCKER** ao comparar a saída do Claude Sonnet 4 com seu predecessor.[^10]

Se um modelo mais barato gera código com quase o dobro da taxa de bugs severos, e a manutenção consome 75–85% do custo do ciclo de vida, as "economias" na geração de código são eclipsadas pelos custos à jusante. O código mais barato para manter é o código que estava correto desde o início.

## Matemática de Assinatura

Para usuários pesados, a escolha assinatura versus API amplifica ainda mais o argumento de qualidade do modelo.

| Plano | Custo Mensal | O que Você Obtém |
|-------|-------------|-----------------|
| Claude Max ($100) | $100 | Uso alto do Opus |
| Claude Max ($200) | $200 | Opus ilimitado |
| Uso equivalente de API | $3.650+ | Os mesmos tokens do Opus |

A assinatura é aproximadamente **18 vezes mais barata** do que o faturamento de API pelo mesmo trabalho.[^11] Ao preço de assinatura, não há custo marginal para usar o melhor modelo — o modelo "caro" se torna literalmente gratuito por consulta adicional.

Custo médio do Claude Code em assinatura: **$6 por desenvolvedor por dia**, com 90% dos usuários abaixo de $12/dia.[^12] A uma taxa horária de $75 para o desenvolvedor, **5 minutos de tempo economizados por dia** pagam pela assinatura. Tudo além disso é retorno puro.

## O Argumento Composto

Eis por que a matemática fica ainda mais desequilibrada ao longo do tempo:

### 1. Menos iterações = menos poluição de contexto

Cada tentativa falha adiciona ao histórico da conversa. Conversas longas degradam o desempenho do modelo — a relação sinal-ruído cai. Um modelo que tem sucesso em 4 iterações tem um contexto mais limpo do que um que luta por 10, o que significa que suas respostas posteriores também são melhores.

### 2. Menos erros = menos fadiga de revisão

Os estudos de produtividade do GitHub Copilot descobriram que os benefícios aumentam com a dificuldade da tarefa.[^13] Tarefas difíceis são onde os modelos baratos mais falham — e onde os modelos caros mais brilham. O estudo de caso da ZoomInfo mostrou um **aumento de produtividade de 40–50%** com IA, com a lacuna aumentando conforme a complexidade crescia.

### 3. Código melhor = melhor aprendizado

Se você é um desenvolvedor desenvolvendo suas habilidades (e todo desenvolvedor deveria ser), o código que você lê molda seus instintos. Ler saída de IA consistentemente correta e bem estruturada ensina bons padrões. Ler saída bugada e verbosa ensina maus hábitos.

### 4. Código correto chega mais rápido

Cada iteração de que você não precisa é um recurso que é lançado mais cedo. Em mercados competitivos, a velocidade de desenvolvimento — medida em recursos entregues, não tokens gerados — é o que importa.

## Para Quem Vibe-Codifica, Isso Não É Sobre Custo — É Sobre Sobrevivência

Tudo acima se aplica a desenvolvedores profissionais que podem ler diffs, detectar bugs e corrigir código quebrado. Mas há um grupo que cresce rapidamente para quem o argumento de qualidade do modelo não é sobre eficiência — é sobre se o software funciona de alguma forma. Estes são os **vibe coders 100%**: não-programadores construindo aplicações reais inteiramente através de prompts em linguagem natural, sem a capacidade de ler, auditar ou entender uma única linha do código gerado.

### O Risco Invisível

Para um desenvolvedor profissional, um modelo barato que gera código bugado é **irritante** — eles detectam o bug na revisão, corrigem e continuam. Para um não-programador, o mesmo bug é **invisível**. Ele vai para a produção sem ser detectado.

A escala desse problema é impressionante:

- A **Veracode** testou mais de 100 LLMs e descobriu que código gerado por IA introduziu falhas de segurança em **45% das tarefas**. Java foi o pior, com mais de 70%. Criticamente, modelos mais novos e maiores não mostraram melhoria significativa na segurança — o problema é estrutural, não geracional.[^14]
- A **CodeRabbit** analisou 470 PRs de código aberto e descobriu que código com IA tinha **1,7x mais problemas graves** e **1,4x mais problemas críticos** do que código humano. Erros de lógica eram 75% maiores. Problemas de desempenho (E/S excessiva) eram **8x mais comuns**. Vulnerabilidades de segurança eram **1,5–2x maiores**.[^15]
- A pesquisa da **BaxBench** e da NYU confirma que **40–62% do código gerado por IA** contém falhas de segurança — cross-site scripting, injeção de SQL, validação de entrada ausente — os tipos de vulnerabilidades que não travam o app, mas expõem silenciosamente os dados de cada usuário.[^16]

Um desenvolvedor profissional reconhece esses padrões. Um vibe coder não sabe que eles existem.

### Catástrofes do Mundo Real

Isso não é teórico. Em 2025, o pesquisador de segurança Matt Palmer descobriu que **170 de 1.645 aplicações** construídas com Lovable — uma plataforma popular de vibe-coding — tinham a segurança do banco de dados fatalmente mal configurada. Qualquer pessoa na internet poderia ler e escrever em seus bancos de dados. Os dados expostos incluíam nomes completos, endereços de e-mail, números de telefone, endereços residenciais, valores de dívida pessoal e chaves de API.[^17]

A Escape.tech foi além, escaneando **mais de 5.600 aplicações vibe-codificadas** implantadas publicamente em plataformas incluindo Lovable, Base44, Create.xyz e Bolt.new. Encontraram mais de **2.000 vulnerabilidades**, **mais de 400 segredos expostos** e **175 instâncias de PII expostas** incluindo prontuários médicos, IBANs e números de telefone.[^18]

Esses não foram erros de desenvolvedores. Os "desenvolvedores" — se é que podemos chamá-los assim — não tinham ideia de que as vulnerabilidades existiam. Eles pediram à IA para construir um app, o app pareceu funcionar e eles o implantaram. As falhas de segurança eram invisíveis para quem não pudesse ler o código.

### A Armadilha da Cadeia de Suprimentos

Os não-programadores enfrentam uma ameaça que mesmo desenvolvedores experientes acham difícil de detectar: **slopsquatting**. Modelos de IA alucinam nomes de pacotes — aproximadamente 20% das amostras de código referenciam pacotes inexistentes. Atacantes registram esses nomes de pacotes fantasmas e injetam malware. Quando a IA do vibe coder sugere instalar o pacote, o malware entra automaticamente na aplicação.[^19]

Um desenvolvedor pode notar um nome de pacote não familiar e verificá-lo. Um vibe coder instala o que a IA mandar. Eles não têm ponto de referência para o que é legítimo e o que é alucinado.

### Por que a Qualidade do Modelo É a Única Rede de Segurança

A equipe de pesquisa Unit 42 da Palo Alto Networks colocou de forma direta: os citizen developers — pessoas sem formação em desenvolvimento — "carecem de treinamento em como escrever código seguro e podem não ter uma compreensão completa dos requisitos de segurança necessários no ciclo de vida da aplicação." Sua investigação encontrou **violações de dados, bypasses de autenticação e execução de código arbitrário** rastreados diretamente a aplicações vibe-codificadas.[^20]

Para desenvolvedores profissionais, revisão de código, testes e auditorias de segurança servem como redes de segurança. Eles capturam o que o modelo perde. Os vibe coders não têm **nenhuma dessas redes de segurança**. Eles não podem revisar código que não conseguem ler. Eles não podem escrever testes para comportamentos que não entendem. Eles não podem auditar propriedades de segurança sobre as quais nunca ouviram falar.

Isso significa que o modelo de IA em si é o **único** controle de qualidade em todo o pipeline. Cada falha que o modelo introduz vai diretamente para os usuários. Não há segunda chance, nenhum checkpoint humano, nenhuma rede de segurança.

E é precisamente aqui que a qualidade do modelo mais importa:

- **O Opus produz 50–75% menos erros** do que modelos mais baratos.[^1] Para um vibe coder com zero capacidade de detectar erros, essa é a diferença entre um app funcionando e um app que vaza silenciosamente os dados dos usuários.
- **O Opus atinge o desempenho máximo em 4 iterações**, não 10.[^1] Cada iteração extra significa que o vibe coder tem que descrever o problema em linguagem natural (eles não conseguem apontar a linha errada), esperar que a IA entenda e esperar que a correção não introduza novos bugs que eles também não conseguem ver.
- **O Opus tem a maior resistência à injeção de prompt** entre os modelos de fronteira — crítico quando o vibe coder está construindo apps que lidam com entrada do usuário que eles não conseguem sanitizar por conta própria.
- **O Opus usa menos tokens por tarefa**, o que significa que gera menos código para realizar o mesmo objetivo — menos código significa menor superfície de ataque, menos lugares para bugs se esconderem em código que ninguém jamais lerá.

Para um desenvolvedor, um modelo barato é um imposto de produtividade. Para um vibe coder, um modelo barato é uma **responsabilidade**. O modelo não é seu assistente — é sua **equipe de engenharia completa**. Contratar o "engenheiro" mais barato possível quando você não tem capacidade de verificar o trabalho dele não é frugalidade. É imprudência.

### A Decisão Real para Não-Programadores

Se você não consegue ler código, você não está escolhendo entre uma ferramenta barata e uma cara. Você está escolhendo entre:

1. **Um modelo que acerta a segurança 55% do tempo** (e você nunca saberá sobre os outros 45%)
2. **Um modelo que acerta a segurança 80%+ do tempo** (e produz dramaticamente menos dos bugs silenciosos e invisíveis que destroem negócios)

O prêmio de 67% por token é irrelevante diante do custo de uma violação de dados que você não sabia ser possível, embutida em código que você não conseguia ler, em uma aplicação que você implantou para usuários reais.

**Para vibe coders, o modelo caro não é a escolha mais barata. É a única responsável.**

## A Estrutura de Decisão

| Se você... | Use... | Por quê |
|------------|--------|---------|
| Programa por horas diariamente | Opus + assinatura | Zero custo marginal, maior qualidade |
| Trabalha em tarefas complexas | Extra-alto / Opus | Menos iterações, menos bugs |
| Mantém código de longa vida | O melhor modelo disponível | Dívida técnica é o custo real |
| Vibe-codifica sem ler código | **Opus — inegociável** | O modelo é sua única rede de segurança |
| Tem orçamento limitado | Ainda Opus via assinatura | $200/mês < custo de depurar saída barata |
| Faz consultas rápidas pontuais | Sonnet / esforço médio | O limiar de qualidade importa menos para tarefas simples |

O único cenário onde modelos mais baratos ganham é para **tarefas triviais onde qualquer modelo tem sucesso na primeira tentativa**. Para todo o resto — que é a maior parte da engenharia de software real — o modelo caro é a escolha barata.

## O Resultado Final

O preço por token é uma métrica de vaidade. O custo por tarefa é a métrica real. E por tarefa, o modelo mais capaz ganha consistentemente — não por uma pequena margem, mas por múltiplos:

- **60% mais barato** por tarefa (menos tokens)
- **60% menos** iterações para o desempenho máximo
- **50–75% menos** erros
- **22.500x** mais valioso em economia de tempo do desenvolvedor do que a diferença de custo em tokens

O modelo mais caro não é um luxo. É a escolha mínima viável para qualquer pessoa que valoriza seu tempo.

[^1]: Anthropic (2025). [Introducing Claude Opus 4.5](https://www.anthropic.com/news/claude-opus-4-5). Principais descobertas: com esforço médio, o Opus 4.5 iguala a melhor pontuação do Sonnet 4.5 no SWE-bench usando 76% menos tokens de saída; com o esforço máximo, o Opus supera o Sonnet em 4,3 pontos percentuais usando 48% menos tokens; redução de 50–75% em erros de chamada de ferramentas e de build/lint; desempenho máximo alcançado em 4 iterações versus até 10 para concorrentes.

[^2]: claudefa.st (2025). [Claude Opus 4.5: 67% Cheaper, 76% Fewer Tokens](https://claudefa.st/blog/models/claude-opus-4-5). Análise mostrando que o prêmio de preço por token é mais do que compensado pelo consumo dramaticamente menor de tokens por tarefa, tornando o Opus a escolha mais econômica para a maioria das cargas de trabalho.

[^3]: Dados de salário de desenvolvedor do Glassdoor (2025): salário médio de desenvolvedor de software nos EUA $121.264–$172.049/ano. A $75/hora, 15 minutos de revisão/correção por iteração falha = $18,75 em tempo humano. Seis iterações extras (lacuna entre 4 e 10) = $112,50 por tarefa complexa. Veja: [Glassdoor Software Developer Salary](https://www.glassdoor.com/Salaries/software-developer-salary-SRCH_KO0,18.htm).

[^4]: Faros AI (2025). [The AI Productivity Paradox](https://www.faros.ai/blog/ai-software-engineering). Estudo de 1.255 equipes e mais de 10.000 desenvolvedores encontrou: desenvolvedores individuais em equipes com alta IA completam 21% mais tarefas e fazem merge de 98% mais PRs, mas o tempo de revisão de PR aumentou 91%, bugs aumentaram 9% por desenvolvedor e o tamanho do PR cresceu 154%. Nenhuma correlação significativa entre adoção de IA e melhorias no desempenho no nível da empresa.

[^5]: SWE-bench Verified Leaderboard, fevereiro de 2026. Agregado de [marc0.dev](https://www.marc0.dev/en/leaderboard), [llm-stats.com](https://llm-stats.com/benchmarks/swe-bench-verified) e [The Unwind AI](https://www.theunwindai.com/p/claude-opus-4-5-scores-80-9-on-swe-bench). O Claude Opus 4.5 foi o primeiro modelo a ultrapassar 80% no SWE-bench Verified.

[^6]: JetBrains AI Blog (2026). [The Best AI Models for Coding: Accuracy, Integration, and Developer Fit](https://blog.jetbrains.com/ai/2026/02/the-best-ai-models-for-coding-accuracy-integration-and-developer-fit/). Análise de custo por tarefa em múltiplos modelos, incorporando consumo de tokens e taxas de sucesso. Veja também: [AI Coding Benchmarks](https://failingfast.io/ai-coding-guide/benchmarks/) em Failing Fast.

[^7]: OpenAI (2025). [GPT-5.1-Codex-Max](https://openai.com/index/gpt-5-1-codex-max/); [Codex Prompting Guide](https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide/). O Codex-Max com esforço de raciocínio médio supera o Codex padrão no mesmo esforço usando 30% menos tokens de raciocínio — o modelo premium é inerentemente mais eficiente em tokens.

[^8]: METR (2025). [Measuring the Impact of Early 2025 AI on Experienced Open-Source Developer Productivity](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/). Ensaio controlado randomizado: 16 desenvolvedores experientes, 246 tarefas, $150/hora de compensação. Desenvolvedores com assistência de IA foram 19% mais lentos. Os desenvolvedores esperavam uma aceleração de 24% e acreditavam depois que eram 20% mais rápidos — uma lacuna de percepção de ~39 pontos percentuais. Menos de 44% do código gerado por IA foi aceito. Veja também: [arXiv:2507.09089](https://arxiv.org/abs/2507.09089).

[^9]: Os dados da indústria sobre custos do ciclo de vida do software consistentemente colocam a manutenção em 60–80% do custo total. Veja: Sommerville, I. (2015). *Software Engineering*, 10ª ed., Capítulo 9: "Os custos de alterar software após o lançamento normalmente excedem em muito os custos de desenvolvimento inicial." Veja também: [MIT Sloan: The Hidden Costs of Coding with Generative AI](https://sloanreview.mit.edu/article/the-hidden-costs-of-coding-with-generative-ai/).

[^10]: GitClear (2024). [AI Code Quality Analysis](https://leaddev.com/technical-direction/how-ai-generated-code-accelerates-technical-debt): aumento de 8x em blocos de código duplicados, aumento de 2x em rotatividade de código (2020–2024). SonarSource (2025): análise de código gerado por IA encontrou falta sistêmica de consciência de segurança em todos os modelos testados, com o Claude Sonnet 4 produzindo quase o dobro da proporção de bugs de nível BLOCKER — um aumento de 93% na taxa de introdução de bugs graves. Veja: [DevOps.com: AI in Software Development](https://devops.com/ai-in-software-development-productivity-at-the-cost-of-code-quality-2/).

[^11]: Level Up Coding (2025). [Claude API vs Subscription Cost Analysis](https://levelup.gitconnected.com/why-i-stopped-paying-api-bills-and-saved-36x-on-claude-the-math-will-shock-you-46454323346c). Comparação de faturamento de assinatura versus API mostrando que as assinaturas são aproximadamente 18x mais baratas para sessões de codificação sustentadas.

[^12]: The CAIO (2025). [Claude Code Pricing Guide](https://www.thecaio.ai/blog/claude-code-pricing-guide). Custo médio do Claude Code: $6 por desenvolvedor por dia, com 90% dos usuários abaixo de $12/dia em planos de assinatura.

[^13]: Peng, S. et al. (2023). [The Impact of AI on Developer Productivity: Evidence from GitHub Copilot](https://arxiv.org/abs/2302.06590). Estudo de laboratório: os desenvolvedores completaram tarefas 55,8% mais rápido com o Copilot. Veja também: estudo de caso da ZoomInfo mostrando aumento de produtividade de 40–50% com IA, com a lacuna crescendo conforme a dificuldade da tarefa aumenta ([arXiv:2501.13282](https://arxiv.org/html/2501.13282v1)).

[^14]: Veracode (2025). [2025 GenAI Code Security Report](https://www.veracode.com/resources/analyst-reports/2025-genai-code-security-report/). Análise de 80 tarefas de codificação em mais de 100 LLMs: código gerado por IA introduziu falhas de segurança em 45% dos casos. Java o pior com mais de 70%, Python/C#/JavaScript em 38–45%. Modelos mais novos e maiores não mostraram melhoria significativa na segurança. Veja também: [anúncio BusinessWire](https://www.businesswire.com/news/home/20250730694951/en/).

[^15]: CodeRabbit (2025). [State of AI vs Human Code Generation Report](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report). Análise de 470 PRs do GitHub de código aberto (320 co-autorizados por IA, 150 apenas humanos): código de IA tinha 1,7x mais problemas graves, 1,4x mais problemas críticos, 75% mais erros de lógica, 1,5–2x mais vulnerabilidades de segurança, 3x mais problemas de legibilidade e quase 8x mais problemas de desempenho (E/S excessiva). Veja também: [cobertura do The Register](https://www.theregister.com/2025/12/17/ai_code_bugs/).

[^16]: Pesquisa da BaxBench e NYU sobre segurança de código de IA. Veja: Tihanyi, N. et al. (2025). [Is Vibe Coding Safe? Benchmarking Vulnerability of Agent-Generated Code in Real-World Tasks](https://arxiv.org/abs/2512.03262). O BaxBench combina cenários de codificação de backend com exploits de segurança projetados por especialistas, encontrando 40–62% do código gerado por IA contendo falhas de segurança incluindo XSS, injeção de SQL e validação de entrada ausente.

[^17]: Palmer, M. (2025). [Statement on CVE-2025-48757](https://mattpalmer.io/posts/statement-on-CVE-2025-48757/). Análise de 1.645 aplicações construídas com Lovable: 170 tinham Row Level Security fatalmente mal configurado, permitindo acesso não autenticado para ler e escrever bancos de dados de usuários. PII exposta incluía nomes, e-mails, números de telefone, endereços residenciais, valores de dívida pessoal e chaves de API. Veja também: [Superblocks: Lovable Vulnerability Explained](https://www.superblocks.com/blog/lovable-vulnerabilities).

[^18]: Escape.tech (2025). [The State of Security of Vibe Coded Apps](https://escape.tech/state-of-security-of-vibe-coded-apps). Scan de mais de 5.600 aplicações vibe-codificadas publicamente implantadas em Lovable, Base44, Create.xyz, Bolt.new e outros. Encontrou mais de 2.000 vulnerabilidades, mais de 400 segredos expostos e 175 instâncias de PII expostas incluindo prontuários médicos, IBANs e números de telefone. Veja também: [detalhe da metodologia](https://escape.tech/blog/methodology-how-we-discovered-vulnerabilities-apps-built-with-vibe-coding/).

[^19]: Lanyado, B. et al. (2025). [AI-hallucinated code dependencies become new supply chain risk](https://www.bleepingcomputer.com/news/security/ai-hallucinated-code-dependencies-become-new-supply-chain-risk/). Estudo de 16 modelos de IA de geração de código: ~20% de 756.000 amostras de código recomendaram pacotes inexistentes. 43% dos pacotes alucinados foram repetidos consistentemente entre consultas, tornando-os exploráveis. Modelos de código aberto alucinaram 21,7%; modelos comerciais 5,2%. Veja também: [HackerOne: Slopsquatting](https://www.hackerone.com/blog/ai-slopsquatting-supply-chain-security).

[^20]: Palo Alto Networks Unit 42 (2025). [Securing Vibe Coding Tools: Scaling Productivity Without Scaling Risk](https://unit42.paloaltonetworks.com/securing-vibe-coding-tools/). Investigação de incidentes de segurança de vibe-coding do mundo real: violações de dados, bypasses de autenticação e execução de código arbitrário. Observa que os citizen developers "carecem de treinamento em como escrever código seguro e podem não ter uma compreensão completa dos requisitos de segurança necessários no ciclo de vida da aplicação." Introduziu o framework de governança SHIELD. Veja também: [cobertura da Infosecurity Magazine](https://www.infosecurity-magazine.com/news/palo-alto-networks-vibe-coding).
