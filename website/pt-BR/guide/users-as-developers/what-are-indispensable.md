# Cinco Habilidades Humanas Básicas que Potencializam a IA

Você não precisa de um diploma em ciência da computação para construir software com ferramentas de codificação com IA. Mas você precisa de um pequeno conjunto de habilidades que nenhuma IA pode substituir. Estas são as fundações indispensáveis — as coisas que tornam tudo o mais possível.

## A Lista Curta

| Habilidade | Por que É Indispensável |
|------------|------------------------|
| **Git** | Sua rede de segurança — desfaça qualquer coisa, crie branches sem medo, nunca perca trabalho |
| **TDD** | A metodologia que mantém o código gerado por IA honesto |
| **Alfabetização em terminal** | Ferramentas de IA vivem no terminal; você precisa ler a saída delas |
| **Inglês** | Docs, erros e prompts de IA funcionam melhor em inglês |
| **Bom gosto** | A IA gera opções; você decide qual é a certa |

É isso. Cinco coisas. Todo o resto — sintaxe de linguagem, APIs de framework, padrões de design — a IA cuida para você.[^1]

## Git — Sua Rede de Segurança

Git é a ferramenta mais importante no seu arsenal. Não porque você precisa dominar rebase ou cherry-picking — a IA cuida disso — mas porque o Git te dá **experimentação sem medo**.[^2]

### O que Você Realmente Precisa Saber

| Comando | O que Faz | Quando Usar |
|---------|-----------|-------------|
| `git status` | Mostra o que mudou | Antes e depois de cada sessão de IA |
| `git diff` | Mostra as mudanças exatas | Revisar o que a IA escreveu antes de commitar |
| `git add` + `git commit` | Salva um checkpoint | Após cada estado funcionando |
| `git log` | Histórico de mudanças | Quando você precisa entender o que aconteceu |
| `git stash` | Guarda mudanças temporariamente | Quando você quer tentar uma abordagem diferente |
| `git checkout -- file` | Desfaz mudanças em um arquivo | Quando a IA piorou algo |
| `git worktree` | Trabalha em múltiplos branches simultaneamente | Quando você quer explorar ideias em paralelo |

### O Modelo Mental

Pense no Git como **desfazer infinito**. Cada commit é um ponto de salvamento ao qual você pode retornar. Isso significa:

- **Tente mudanças arriscadas livremente** — você sempre pode voltar
- **Deixe a IA experimentar** — se quebrar algo, reverta
- **Trabalhe em múltiplas ideias** — branches permitem explorar em paralelo
- **Revise antes de aceitar** — `git diff` mostra exatamente o que a IA mudou

A IA criará commits, branches e pull requests para você. Mas você deve entender o que são, porque você é quem decide quando salvar, quando criar um branch e quando fazer merge.

### Git Worktrees — Universos Paralelos

Um recurso do Git que vale aprender cedo é **worktrees**. Um worktree permite que você faça checkout de um branch diferente em um diretório separado — sem mudar seu trabalho atual:

```bash
# Cria um worktree para um novo recurso
git worktree add ../my-feature -b feature/new-idea

# Trabalha nele
cd ../my-feature
claude    # inicia uma sessão de IA neste branch

# De volta ao seu trabalho principal — intocado
cd ../vmark
```

Isso é especialmente poderoso com ferramentas de codificação com IA: você pode ter uma sessão de IA experimentando em um branch de recurso enquanto seu branch principal permanece limpo e funcionando. Se o experimento falhar, basta deletar o diretório worktree. Sem bagunça, sem risco.

::: warning Não Pule o Git
Sem Git, uma única edição ruim da IA pode arruinar horas de trabalho sem como voltar. Com Git, o pior caso é sempre `git checkout -- .` e você está de volta ao seu último save. Aprenda o básico do Git antes de qualquer outra coisa.
:::

## TDD — Como Você Mantém a IA Honesta

Test-Driven Development é a metodologia que transforma a codificação com IA de "torço para que funcione" em "provo que funciona". Não é apenas uma boa prática — é seu mecanismo primário para **verificar** que o código gerado por IA realmente faz o que você pediu.[^3]

### O Ciclo RED-GREEN-REFACTOR

TDD segue um loop estrito de três etapas:

```
1. RED     — Escreva um teste que descreve o que você quer. Ele falha.
2. GREEN   — Peça à IA para escrever o código mínimo para passar no teste.
3. REFACTOR — Limpe sem mudar o comportamento. Os testes ainda passam.
```

Isso funciona notavelmente bem com ferramentas de codificação com IA porque:

| Etapa | Seu Papel | Papel da IA |
|-------|-----------|-------------|
| RED | Descrever o comportamento esperado | Ajudar a escrever a asserção do teste |
| GREEN | Verificar se o teste passa | Escrever a implementação |
| REFACTOR | Julgar se o código está limpo o suficiente | Fazer a limpeza |

### Por que TDD Importa Mais com IA

Quando você escreve código por conta própria, você o entende implicitamente — você sabe o que ele faz porque você o escreveu. Quando a IA escreve código, você precisa de um **mecanismo de verificação externo**. Testes são esse mecanismo.[^4]

Sem testes, é o que acontece:

1. Você pede à IA para adicionar um recurso
2. A IA escreve 200 linhas de código
3. Você lê, *parece* certo
4. Você lança
5. Quebra algo que você não notou — um caso extremo sutil, uma incompatibilidade de tipo, um erro off-by-one

Com TDD:

1. Você descreve o comportamento como um teste (a IA te ajuda a escrever)
2. O teste falha — confirmando que está testando algo real
3. A IA escreve código para fazê-lo passar
4. Você roda o teste — ele passa
5. Você tem **prova** de que funciona, não apenas um sentimento

### Como um Teste Se Parece

Você não precisa escrever testes do zero. Descreva o que você quer em linguagem simples, e a IA escreve o teste. Mas você deve ser capaz de **ler** um teste:

```ts
// "Quando o usuário salva um documento, a flag de modificado deve limpar"
it("clears modified flag after save", () => {
  // Setup: marca o documento como modificado
  store.markModified("doc-1");
  expect(store.isModified("doc-1")).toBe(true);

  // Ação: salva o documento
  store.save("doc-1");

  // Verifica: a flag de modificado está limpa
  expect(store.isModified("doc-1")).toBe(false);
});
```

O padrão é sempre o mesmo: **setup**, **ação**, **verificação**. Quando você reconhece esse padrão, pode ler qualquer teste — e mais importante, pode dizer à IA o que testar a seguir.

### Casos Extremos — Onde os Bugs Vivem

O poder real do TDD está nos **casos extremos** — entradas incomuns e condições de fronteira onde os bugs se escondem. A IA é surpreendentemente ruim em pensar nesses por conta própria.[^5] Mas você pode provocá-la:

> "O que acontece se o nome do arquivo estiver vazio?"
> "E se o usuário clicar duas vezes no botão salvar?"
> "E se a rede cair no meio de uma requisição?"
> "E quanto a um arquivo com caracteres Unicode no nome?"

Cada um desses vira um teste. Cada teste vira uma garantia. Quanto mais casos extremos você pensa, mais robusto o seu software se torna. É aqui que o **bom gosto** humano e a **velocidade de implementação** da IA se combinam para produzir algo que nenhum dos dois poderia alcançar sozinho.

### TDD na Prática com IA

Aqui está um fluxo de trabalho real:

```
Você:   Adicione uma função que verifica se um nome de arquivo é válido.
        Comece com um teste falhando.

IA:     [Escreve o teste] it("rejects empty filenames", () => { ... })
        [Teste falha — RED ✓]

Você:   Agora faça-o passar.

IA:     [Escreve isValidFilename()]
        [Teste passa — GREEN ✓]

Você:   Adicione testes para: apenas espaços, separadores de caminho,
        nomes com mais de 255 caracteres, bytes nulos.

IA:     [Escreve 4 testes a mais, alguns falham]
        [Atualiza a função para tratar todos os casos]
        [Todos os testes passam — GREEN ✓]

Você:   Bom. Refatore se necessário.

IA:     [Simplifica o regex, mantém os testes passando — REFACTOR ✓]
```

Você não escreveu uma única linha de código. Mas guiou cada decisão. Os testes provam que o código funciona. E se alguém mudar a função mais tarde, os testes detectam regressões.

::: tip O Catraca de Cobertura
O VMark impõe limites de cobertura de teste — se a cobertura cair abaixo do mínimo, o build falha. Isso significa que cada novo recurso *deve* ter testes. A IA sabe disso e escreve testes automaticamente, mas você deve verificar se eles testam comportamento significativo, não apenas linhas de código.
:::

## Alfabetização em Terminal

Ferramentas de codificação com IA são programas de linha de comando. Claude Code, Codex CLI, Gemini CLI — todos rodam em um terminal. Você não precisa memorizar centenas de comandos, mas precisa estar confortável com alguns:

```bash
cd ~/projects/vmark      # Navega para um diretório
ls                        # Lista arquivos
git status                # Vê o que mudou
git log --oneline -5      # Commits recentes
pnpm install              # Instala dependências
pnpm test                 # Roda testes
```

A IA vai sugerir e rodar comandos para você. Seu trabalho é **ler a saída** e entender se as coisas tiveram sucesso ou falharam. Uma falha de teste parece diferente de um erro de build. Um "permission denied" é diferente de "file not found". Você não precisa corrigir esses você mesmo — mas precisa descrever o que vê para que a IA possa corrigir.

::: tip Comece Aqui
Se você nunca usou um terminal, comece com [The Missing Semester](https://missing.csail.mit.edu/) do MIT — especificamente a primeira aula sobre ferramentas de shell. Uma hora de prática te dá o suficiente para trabalhar com ferramentas de codificação com IA.
:::

## Proficiência em Inglês

Não se trata de escrever prosa perfeita. É sobre **compreensão de leitura** — entender mensagens de erro, documentação e explicações da IA. Todo o ecossistema de software funciona em inglês:[^6]

- **Mensagens de erro** estão em inglês
- **Documentação** é escrita em inglês primeiro (e muitas vezes apenas em inglês)
- **Stack Overflow**, issues do GitHub e tutoriais são predominantemente em inglês
- **Os modelos de IA têm desempenho visivelmente melhor** com prompts em inglês (veja [Por que Prompts em Inglês Produzem Código Melhor](/pt-BR/guide/users-as-developers/prompt-refinement))

Você não precisa escrever fluentemente. Você precisa:

1. **Ler** uma mensagem de erro e entender o essencial
2. **Pesquisar** termos técnicos efetivamente
3. **Descrever** o que você quer à IA claramente o suficiente

Se o inglês não é sua primeira língua, o hook `::` do VMark traduz e refina seus prompts automaticamente. Mas ler as respostas da IA — que estão em inglês — é algo que você fará constantemente.

## Bom Gosto — A Única Coisa que a IA Não Pode Substituir

Isso é o mais difícil de definir e o mais importante. **Bom gosto** é saber como algo bom se parece — mesmo que você ainda não consiga construi-lo por conta própria.[^7]

Quando a IA oferece três abordagens para resolver um problema, bom gosto é o que te diz:

- A simples é melhor que a inteligente
- A solução com menos dependências é preferível
- O código que se lê como prosa supera o código "otimizado"
- Uma função de 10 linhas é suspeita se 5 linhas resolveriam

### Como Desenvolver Bom Gosto

1. **Use bons softwares** — note o que parece certo e o que parece desajeitado
2. **Leia código bom** — navegue por projetos populares de código aberto no GitHub
3. **Leia a saída** — quando a IA gera código, leia-o mesmo que não consiga escrevê-lo
4. **Pergunte "por quê"** — quando a IA faz uma escolha, peça para ela explicar as trocas
5. **Itere** — se algo parece errado, provavelmente está. Peça à IA para tentar de novo

Bom gosto se acumula. Quanto mais código você lê (mesmo código gerado por IA), melhores seus instintos se tornam. Depois de alguns meses de desenvolvimento assistido por IA, você detectará problemas que a IA perde — não porque você sabe mais sintaxe, mas porque você sabe como o **resultado deveria parecer**.

::: tip O Teste do Bom Gosto
Depois que a IA termina uma tarefa, pergunte a si mesmo: "Se eu fosse um usuário, isso pareceria certo?" Se a resposta não for um sim imediato, diga à IA o que parece errado. Você não precisa saber o conserto — apenas o sentimento.
:::

## O que Você Não Precisa

Tão importante quanto saber o essencial é saber o que você pode pular com segurança:

| Você Não Precisa | Porque |
|------------------|--------|
| Domínio de linguagem de programação | A IA escreve o código; você o revisa |
| Expertise em frameworks | A IA conhece React, Rails, Django melhor que a maioria dos humanos |
| Conhecimento de algoritmos | A IA implementa algoritmos; você descreve o objetivo |
| Habilidades em DevOps | A IA escreve configs de CI, Dockerfiles, scripts de deploy |
| Padrões de design memorizados | A IA aplica o padrão certo quando você descreve o comportamento |
| Anos de experiência | Perspectiva fresca + IA > experiência sem IA[^8] |

Isso não significa que essas habilidades são inúteis — elas te tornam mais rápido e eficaz. Mas elas não são mais **pré-requisitos**. Você pode aprendê-las gradualmente, no trabalho, com a IA te ensinando enquanto você avança.

## O Efeito Composto

Essas cinco habilidades — Git, TDD, terminal, inglês e bom gosto — não apenas somam. Elas se **compõem**.[^9]

- A segurança do Git permite experimentar livremente, o que desenvolve bom gosto mais rápido
- TDD te dá confiança na saída da IA, então você pode se mover mais rápido
- Fluência no terminal permite rodar testes e comandos Git sem atrito
- Compreensão de inglês permite ler mensagens de erro e documentação
- Bom gosto torna seus prompts mais precisos, o que produz código melhor
- Código melhor te dá melhores exemplos para aprender

Depois de algumas semanas de desenvolvimento assistido por IA, você se encontrará entendendo coisas que nunca estudou formalmente. Esse é o efeito composto em ação — e é por isso que essas cinco fundações, e apenas essas cinco, são verdadeiramente indispensáveis.

[^1]: Os movimentos "no-code" e "low-code" têm tentado remover barreiras de programação por anos. As ferramentas de codificação com IA alcançam isso de forma mais eficaz porque não restringem o que você pode construir — elas escrevem código arbitrário em qualquer linguagem, seguindo qualquer padrão, com base em descrições em linguagem natural. Veja: Jiang, E. et al. (2022). [Discovering the Syntax and Strategies of Natural Language Programming with Generative Language Models](https://dl.acm.org/doi/10.1145/3491102.3501870). *CHI 2022*.

[^2]: O modelo de branching do Git muda fundamentalmente como as pessoas abordam a experimentação. Pesquisas sobre fluxos de trabalho de desenvolvedores mostram que equipes usando commits frequentes e pequenos com branches são significativamente mais propensas a tentar mudanças arriscadas — porque o custo do fracasso cai para quase zero. Veja: Bird, C. et al. (2009). [Does Distributed Development Affect Software Quality?](https://dl.acm.org/doi/10.1145/1555001.1555040). *ICSE 2009*.

[^3]: Test-Driven Development foi formalizado por Kent Beck em 2002 e desde então se tornou um pilar da engenharia de software profissional. A disciplina de escrever testes primeiro força os desenvolvedores a clarificar os requisitos antes da implementação — um benefício que se torna ainda mais poderoso quando o "desenvolvedor" é uma IA que precisa de instruções precisas. Veja: Beck, K. (2002). [Test-Driven Development: By Example](https://www.oreilly.com/library/view/test-driven-development/0321146530/). Addison-Wesley.

[^4]: Estudos sobre geração de código com IA consistentemente descobrem que o código gerado por IA passa em testes funcionais com taxas mais baixas do que código escrito por humanos, a menos que seja guiado por casos de teste explícitos. Fornecer casos de teste no prompt aumenta a geração de código correto em 20–40%. Veja: Chen, M. et al. (2021). [Evaluating Large Language Models Trained on Code](https://arxiv.org/abs/2107.03374). *arXiv:2107.03374*; Austin, J. et al. (2021). [Program Synthesis with Large Language Models](https://arxiv.org/abs/2108.07732). *arXiv:2108.07732*.

[^5]: Modelos de IA têm desempenho sistematicamente inferior em casos extremos e condições de fronteira. Eles tendem a gerar código de "caminho feliz" que lida com entradas comuns, mas falha em entradas incomuns. Essa é uma limitação documentada da geração de código baseada em transformers — os dados de treinamento são tendenciosos em direção a padrões de uso típicos. Veja: Pearce, H. et al. (2022). [Examining Zero-Shot Vulnerability Repair with Large Language Models](https://arxiv.org/abs/2112.02125). *IEEE S&P 2022*.

[^6]: O inglês domina a programação e a documentação técnica por uma margem esmagadora. A análise dos repositórios públicos do GitHub mostra que mais de 90% dos arquivos README e comentários de código estão em inglês. Da mesma forma, as 23 milhões de perguntas do Stack Overflow são predominantemente em inglês. Veja: Casalnuovo, C. et al. (2015). [Developer Onboarding in GitHub](https://dl.acm.org/doi/10.1145/2786805.2786854). *ESEC/FSE 2015*.

[^7]: O "bom gosto" em engenharia de software — a capacidade de distinguir bom design de ruim — é cada vez mais reconhecido como uma habilidade central. Fred Brooks escreveu que "grandes designs vêm de grandes designers", não de grandes processos. Com a IA cuidando dos aspectos mecânicos da codificação, esse julgamento estético se torna a contribuição humana primária. Veja: Brooks, F. (2010). [The Design of Design](https://www.oreilly.com/library/view/the-design-of/9780321702081/). Addison-Wesley.

[^8]: Estudos sobre programação assistida por IA mostram que desenvolvedores com menos experiência muitas vezes se beneficiam mais das ferramentas de IA do que especialistas — porque a lacuna entre "pode descrever" e "pode implementar" encolhe dramaticamente com a assistência da IA. Veja: Peng, S. et al. (2023). [The Impact of AI on Developer Productivity](https://arxiv.org/abs/2302.06590). *arXiv:2302.06590*.

[^9]: O conceito de "aprendizado composto" — onde habilidades fundamentais aceleram a aquisição de habilidades relacionadas — é bem estabelecido na pesquisa educacional. Em programação especificamente, entender algumas ideias centrais desbloqueia o aprendizado rápido de tudo construído sobre elas. Veja: Sorva, J. (2012). [Visual Program Simulation in Introductory Programming Education](https://aaltodoc.aalto.fi/handle/123456789/3534). Aalto University.
