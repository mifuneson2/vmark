# Por que Aceitamos Issues, Não PRs

O VMark não aceita pull requests. Bem-vindas são as issues — quanto mais detalhadas, melhor. Esta página explica o porquê.

## A Versão Curta

O VMark é vibe-codificado. Toda a base de código é escrita por IA sob a supervisão de um único mantenedor. Quando alguém envia um pull request, há um problema fundamental: **um humano não consegue revisar significativamente o código gerado por IA de outro humano**. O revisor não entende o código do colaborador porque nenhum dos dois o escreveu no sentido tradicional — suas IAs o fizeram.

As issues não têm esse problema. Uma issue bem escrita descreve *o que* deve acontecer. A IA do mantenedor então corrige a base de código com pleno contexto das convenções, suite de testes e arquitetura do projeto. O resultado é consistente, testado e manutenível.

## O que "Vibe-Codificado" Realmente Significa

O termo "vibe coding" foi cunhado por Andrej Karpathy no início de 2025 para descrever um estilo de programação onde você descreve o que quer em linguagem natural e deixa uma IA escrever o código. Você guia a direção, mas não está escrevendo — ou muitas vezes nem mesmo lendo — cada linha.[^1]

O VMark vai mais longe do que a maioria dos projetos. O repositório inclui:

- **`AGENTS.md`** — Regras do projeto que toda ferramenta de IA lê na inicialização
- **`.claude/rules/`** — Mais de 15 arquivos de regras cobrindo TDD, tokens de design, padrões de componentes, acessibilidade e mais
- **Comandos slash** — Fluxos de trabalho pré-construídos para auditar, corrigir e verificar código
- **Verificação entre modelos** — Claude escreve, Codex audita (veja [Verificação entre Modelos](/pt-BR/guide/users-as-developers/cross-model-verification))

A IA não gera código aleatório. Ela opera dentro de uma densa teia de restrições — convenções, testes e verificações automatizadas — que mantêm a base de código consistente. Mas isso só funciona quando **uma sessão de IA tem contexto completo** dessas restrições.

## A Lacuna de Compreensão

Aqui está o problema central com pull requests gerados por IA: ninguém os lê completamente.

Pesquisa da conferência Foundations of Software Engineering da ACM descobriu que desenvolvedores — especialmente aqueles que não escreveram o código eles mesmos — têm dificuldade de entender código gerado por LLMs. O estudo, intitulado *"I Would Have Written My Code Differently": Beginners Struggle to Understand LLM-Generated Code*, documentou como mesmo desenvolvedores tecnicamente capazes têm dificuldade de raciocinar sobre código que não produziram quando uma IA o escreveu.[^2]

Isso não é apenas um problema de iniciantes. Uma análise de 2025 de mais de 500.000 pull requests pela CodeRabbit descobriu que PRs gerados por IA contêm **1,7x mais problemas** do que PRs escritos por humanos — incluindo 75% mais erros de lógica e correção. A maior preocupação? Esses são precisamente os erros que parecem razoáveis durante a revisão, a menos que você percorra o código passo a passo.[^3]

A matemática piora quando ambos os lados usam IA:

| Cenário | O revisor entende o código? |
|---------|---------------------------|
| Humano escreve, humano revisa | Sim — o revisor pode raciocinar sobre a intenção |
| IA escreve, autor original revisa | Parcialmente — o autor guiou a IA e tem contexto |
| IA escreve, humano diferente revisa | Pouco — o revisor não tem contexto de autoria nem de sessão de IA |
| IA escreve para pessoa A, IA revisa para pessoa B | Nenhum humano entende o código profundamente |

O VMark está na última linha. Quando um colaborador abre um PR gerado por sua IA, e a IA do mantenedor o revisa, os dois humanos no loop têm o menor entendimento de qualquer cenário. Essa não é uma receita para software de qualidade.

## Por que PRs Gerados por IA São Diferentes de PRs Humanos

A revisão de código tradicional funciona por causa de uma base compartilhada: tanto o autor quanto o revisor entendem a linguagem de programação, os padrões e os idiomas. O revisor pode simular mentalmente a execução do código e detectar inconsistências.

Com código gerado por IA, essa base compartilhada se deteriora. A pesquisa mostra vários modos de falha específicos:

**Deriva de convenção.** A IA tem uma "tendência avassaladora de não entender quais são as convenções existentes dentro de um repositório", gerando sua própria versão ligeiramente diferente de como resolver um problema.[^4] A sessão de IA de cada colaborador produz código que funciona isoladamente, mas conflita com os padrões do projeto. No VMark, onde aplicamos padrões específicos de store Zustand, uso de tokens CSS e estruturas de plugin, a deriva de convenção seria devastadora.

**Isolamento de contexto.** Recursos vibe-codificados são frequentemente "gerados isoladamente, onde a IA cria implementações razoáveis para cada prompt, mas não tem memória de decisões arquiteturais de sessões anteriores."[^5] A IA de um colaborador não sabe sobre os 15 arquivos de regras do VMark, seu pipeline de auditoria entre modelos ou suas convenções específicas de plugin ProseMirror — a menos que o colaborador tenha configurado meticulosamente tudo isso.

**Gargalo de revisão.** Desenvolvedores usando IA completam 21% mais tarefas e fazem merge de 98% mais pull requests, mas o tempo de revisão de PR aumenta 91%.[^6] A velocidade da geração de código com IA cria uma mangueira de código que sobrecarrega a capacidade de revisão humana. Para um mantenedor solo, isso é insustentável.

## O Precedente do SQLite

O VMark não é o primeiro projeto a restringir contribuições. SQLite — uma das bibliotecas de software mais amplamente implantadas no mundo — tem sido "open source, mas não open contribution" em toda a sua história. O projeto não aceita patches de pessoas aleatórias na internet. Os colaboradores podem sugerir mudanças e incluir código de prova de conceito, mas os desenvolvedores principais tipicamente reescrevem os patches do zero.[^7]

O raciocínio do SQLite é diferente (eles precisam manter o status de domínio público), mas o resultado é o mesmo: **a qualidade é mantida por uma única equipe com contexto completo** escrevendo todo o código. As contribuições externas são canalizadas através de relatórios de bugs e sugestões de recursos, em vez de mudanças diretas de código.

Outros projetos notáveis adotaram posições semelhantes. O modelo Benevolent Dictator for Life (BDFL) — usado historicamente pelo Python (Guido van Rossum), Linux (Linus Torvalds) e muitos outros — concentra a autoridade final em uma pessoa que garante a coerência arquitetural.[^8] O VMark simplesmente torna isso explícito: o "ditador" é a IA, supervisionada pelo mantenedor.

## Por que Issues Funcionam Melhor

Uma issue é uma **especificação**, não uma implementação. Ela descreve o que está errado ou o que é necessário, sem se comprometer com uma solução específica. Esta é uma melhor interface entre colaboradores e uma base de código mantida por IA:

| Tipo de contribuição | O que fornece | Risco |
|---------------------|---------------|-------|
| Pull request | Código que você deve entender, revisar, testar e manter | Deriva de convenção, perda de contexto, carga de revisão |
| Issue | Uma descrição do comportamento desejado | Nenhum — o mantenedor decide se e como agir |

### O que Torna uma Issue Excelente

As melhores issues se leem como documentos de requisitos:

1. **Comportamento atual** — O que acontece agora (com etapas para reproduzir para bugs)
2. **Comportamento esperado** — O que deveria acontecer em vez disso
3. **Contexto** — Por que isso importa, o que você estava tentando fazer
4. **Ambiente** — SO, versão do VMark, configurações relevantes
5. **Capturas de tela ou gravações** — Quando o comportamento visual está envolvido

Você é bem-vindo para usar IA para escrever issues. Na verdade, encorajamos isso. Um assistente de IA pode ajudá-lo a estruturar uma issue detalhada e bem organizada em minutos. A ironia é intencional: **a IA é ótima em descrever problemas claramente, e a IA é ótima em corrigir problemas claramente descritos.** O gargalo é o meio nebuloso — entender a solução gerada por IA de outra pessoa — que as issues contornam elegantemente.

### O que Acontece Depois que Você Abre uma Issue

1. O mantenedor lê e triaga a issue
2. A IA recebe a issue como contexto, junto com pleno conhecimento da base de código
3. A IA escreve uma correção seguindo TDD (teste primeiro, depois implementação)
4. Um segundo modelo de IA (Codex) audita a correção independentemente
5. Gates automatizados são executados (`pnpm check:all` — lint, testes, cobertura, build)
6. O mantenedor revisa a mudança no contexto e faz merge

Este pipeline produz código que é:
- **Conforme às convenções** — A IA lê os arquivos de regras em cada sessão
- **Testado** — TDD é obrigatório; limites de cobertura são impostos
- **Verificado entre modelos** — Um segundo modelo audita para erros de lógica, segurança e código morto
- **Arquiteturalmente coerente** — Uma sessão de IA com contexto completo, não fragmentos de muitas

## O Panorama Maior

A era da IA está forçando uma reavaliação de como funciona a contribuição em código aberto. O modelo tradicional — fork, branch, código, PR, revisão, merge — pressupunha que humanos escrevem código e outros humanos conseguem lê-lo. Quando a IA gera o código, ambos os pressupostos enfraquecem.

Uma pesquisa de 2025 com desenvolvedores profissionais descobriu que eles "não fazem vibe coding; em vez disso, controlam cuidadosamente os agentes através de planejamento e supervisão."[^9] A ênfase está em **controle e contexto** — exatamente o que se perde quando um PR chega da sessão de IA não relacionada de um colaborador externo.

Acreditamos que o futuro da contribuição em código aberto na era da IA parece diferente:

- **Issues se tornam a contribuição primária** — Descrever problemas é uma habilidade universal
- **Mantenedores controlam a IA** — Uma equipe com contexto completo produz código consistente
- **Verificação entre modelos substitui a revisão humana** — Auditoria adversarial de IA detecta o que humanos perdem
- **Testes substituem a confiança** — Gates automatizados, não o julgamento do revisor, determinam se o código está correto

O VMark está experimentando com este modelo abertamente. Pode não ser a abordagem certa para todo projeto. Mas para uma base de código vibe-codificada mantida por uma pessoa com ferramentas de IA, é a abordagem que produz o melhor software.

## Como Contribuir

**Abra uma issue.** É só isso. Quanto mais detalhes você fornecer, melhor será a correção.

- **[Bug Report](https://github.com/xiaolai/vmark/issues/new?template=bug_report.yml)**
- **[Feature Request](https://github.com/xiaolai/vmark/issues/new?template=feature_request.yml)**

Sua issue se torna a especificação da IA. Uma issue clara leva a uma correção correta. Uma issue vaga leva a idas e vindas. Invista na descrição — ela determina diretamente a qualidade do resultado.

---

[^1]: Karpathy, A. (2025). [Vibe coding](https://en.wikipedia.org/wiki/Vibe_coding). Originalmente descrito em uma publicação em redes sociais, o termo rapidamente entrou no vocabulário mainstream de desenvolvedores. A Wikipedia observa que o vibe coding "depende de ferramentas de IA para gerar código a partir de prompts em linguagem natural, reduzindo ou eliminando a necessidade de o desenvolvedor escrever código manualmente."

[^2]: Jury, J. et al. (2025). ["I Would Have Written My Code Differently": Beginners Struggle to Understand LLM-Generated Code](https://dl.acm.org/doi/pdf/10.1145/3696630.3731663). *FSE Companion '25*, 33ª Conferência Internacional ACM sobre os Fundamentos da Engenharia de Software. O estudo descobriu que os desenvolvedores que não criaram o prompt de IA tinham dificuldade significativa em entender e raciocinar sobre o código gerado.

[^3]: CodeRabbit. (2025). [AI-Assisted Pull Requests Report](https://www.helpnetsecurity.com/2025/12/23/coderabbit-ai-assisted-pull-requests-report/). Análise de mais de 500.000 pull requests descobriu que PRs gerados por IA contêm 10,83 problemas cada versus 6,45 em PRs humanos (1,7x mais), com 75% mais erros de lógica e correção e 1,4x mais problemas críticos.

[^4]: Osmani, A. (2025). [Code Review in the Age of AI](https://addyo.substack.com/p/code-review-in-the-age-of-ai). Análise de como o código gerado por IA interage com bases de código existentes, observando a tendência da IA de criar padrões inconsistentes que desviam das convenções estabelecidas do projeto.

[^5]: Weavy. (2025). [You Can't Vibe Code Your Way Out of a Vibe Coding Mess](https://www.weavy.com/blog/you-cant-vibe-code-your-way-out-of-a-vibe-coding-mess). Documenta como recursos vibe-codificados gerados em sessões isoladas de IA criam conflitos arquiteturais quando combinados, porque cada sessão não tem consciência das decisões tomadas em outras sessões.

[^6]: SoftwareSeni. (2025). [Why AI Coding Speed Gains Disappear in Code Reviews](https://www.softwareseni.com/why-ai-coding-speed-gains-disappear-in-code-reviews/). Relata que, embora os desenvolvedores assistidos por IA completem 21% mais tarefas e façam merge de 98% mais PRs, o tempo de revisão de PR aumenta 91% — revelando que a IA desloca o gargalo de escrever para revisar.

[^7]: SQLite. [SQLite Copyright](https://sqlite.org/copyright.html). O SQLite tem sido "open source, mas não open contribution" desde o seu início. O projeto não aceita patches de colaboradores externos para manter o status de domínio público e a qualidade do código. Os colaboradores podem sugerir mudanças, mas a equipe central reescreve as implementações do zero.

[^8]: Wikipedia. [Benevolent Dictator for Life](https://en.wikipedia.org/wiki/Benevolent_dictator_for_life). O modelo de governança BDFL, usado por Python, Linux e muitos outros projetos, concentra a autoridade arquitetural em uma pessoa para manter a coerência. BDFLs notáveis incluem Guido van Rossum (Python), Linus Torvalds (Linux) e Larry Wall (Perl).

[^9]: Dang, H.T. et al. (2025). [Professional Software Developers Don't Vibe, They Control: AI Agent Use for Coding in 2025](https://arxiv.org/html/2512.14012). Pesquisa com desenvolvedores profissionais descobriu que eles mantêm controle rigoroso sobre agentes de IA através de planejamento e supervisão, em vez de adotar a abordagem hands-off de "vibe coding".
