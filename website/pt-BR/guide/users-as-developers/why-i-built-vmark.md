# Por que Construí um Editor Markdown: VMark

::: info TL;DR
Um não-programador começou o vibe coding em agosto de 2025 e construiu o VMark — um editor Markdown — em seis semanas. Lições principais: **git é obrigatório** (é o seu botão de desfazer), **TDD mantém a IA honesta** (testes são fronteiras contra bugs), **você está fazendo vibe thinking, não vibe coding** (a IA faz o trabalho braçal, você faz o julgamento), e **o debate entre modelos supera a confiança em um único modelo**. A jornada provou que usuários podem se tornar desenvolvedores — mas somente se investirem em algumas habilidades fundamentais.
:::

## Como Começou

Na verdade, construir o VMark tem sido principalmente uma jornada de aprendizado e experiencial para mim mesmo.

Comecei a experimentar a tendência emergente de programação conhecida como *vibe coding* em 17 de agosto de 2025. O próprio termo *vibe coding* foi cunhado e divulgado pela primeira vez em 2 de fevereiro de 2025, originando-se de uma postagem de Andrej Karpathy no [X](https://x.com/karpathy/status/1886192184808149383) (antigo Twitter).

![Tweet de Andrej Karpathy cunhando "vibe coding"](./images/karpathy-vibe-coding.png)

Andrej Karpathy é um pesquisador e educador altamente influente no campo do aprendizado de máquina. Ele ocupou cargos importantes em empresas como OpenAI e Tesla, e mais tarde fundou a Eureka Labs, focando na educação nativa de IA. Seu tweet não apenas introduziu o conceito de "vibe coding", mas também se espalhou rapidamente pela comunidade tecnológica, gerando extensas discussões de acompanhamento.

Quando notei e comecei a usar as ferramentas de vibe coding, quase meio ano já havia passado. Naquela época, o Claude Code ainda estava na versão [1.0.82](https://github.com/anthropics/claude-code/commit/b1751f2). Enquanto escrevo este documento em 9 de fevereiro de 2026, ele chegou à versão [2.1.37](https://github.com/anthropics/claude-code/commit/85f28079913b67a498ce16f32fd88aeb72a01939), tendo passado por 112 atualizações de versão no intervalo.

No começo, usei essas ferramentas apenas para aprimorar alguns scripts de automação que havia escrito há muito tempo — por exemplo, traduzir e-books em lote. O que percebi foi que estava apenas amplificando habilidades que já possuía.

Se eu já sabia como fazer algo, a IA me ajudou a fazê-lo melhor. Se eu não sabia como fazer algo, a IA frequentemente me dava a ilusão de que eu poderia — geralmente com um momento inicial de "uau" — seguido de nada. O que eu originalmente não conseguia fazer, ainda não conseguia. Aquelas belas imagens, vídeos chamativos e artigos longos eram, em muitos casos, apenas outra forma de "Hello World" para uma nova era.[^1]

Não sou completamente ignorante em programação, mas certamente não sou um engenheiro de computação de verdade. Na melhor das hipóteses, sou um usuário avançado entre os usuários comuns. Conheço algum código, e até publiquei um livro sobre programação Python. Mas isso não me torna um engenheiro. É como alguém que pode construir uma cabana de palha: eles sabem mais do que alguém que não consegue, mas não estão nem remotamente na mesma categoria daqueles que projetam arranha-céus ou pontes.

E então, a IA mudou tudo.

## De Scripts para Software

Desde o início até agora, experimentei quase todos os CLIs de codificação IA disponíveis: Claude Code, Codex CLI, Gemini CLI, até ferramentas não oficiais como Grok CLI, bem como alternativas de código aberto como o Aider. No entanto, o que mais usei foi sempre o Claude Code. Após o Codex CLI introduzir um servidor MCP, usei o Claude Code ainda mais, pois ele podia chamar o Codex CLI diretamente no Modo Interativo. Ironicamente, embora o Claude Code tenha sido o primeiro a propor o protocolo MCP, ainda não fornece um servidor MCP próprio (em 2026-02-10).

No início, o Claude Code parecia um especialista profissional de TI que de repente se mudou para a minha casa — alguém que você normalmente só encontraria em grandes empresas. Qualquer coisa relacionada a computadores podia ser entregue a ele. Ele resolvia problemas usando ferramentas de linha de comando que eu nunca havia visto antes, ou comandos familiares usados de maneiras desconhecidas.

Desde que recebesse permissões suficientes, quase não havia nada que ele não pudesse fazer: manutenção do sistema, atualizações, rede, implantação de software ou serviços com inúmeras configurações e conflitos complicados. Você nunca poderia contratar uma pessoa assim por USD 200 por mês.

Depois disso, o número de máquinas que usei começou a aumentar. As instâncias em nuvem cresceram de uma ou duas para cinco ou seis; as máquinas em casa aumentaram de duas ou três para sete ou oito. Problemas que costumavam levar dias para configurar — e muitas vezes falhavam devido ao meu conhecimento limitado — desapareceram repentinamente. O Claude Code tratou todas as operações de máquina para mim, e após corrigir problemas, ele até escreveu scripts de inicialização automática para garantir que os mesmos problemas nunca ocorressem novamente.

Então comecei a escrever coisas que nunca havia sido capaz de escrever antes.

Primeiro veio uma extensão de navegador chamada **Insidebar-ai**, projetada para reduzir a constante troca de contexto e cópia e colagem no navegador. Depois veio o **Tepub**, que na verdade parecia um software real: uma ferramenta de linha de comando Python para traduzir livros EPUB (monolíngue ou bilíngue) e até gerar audiolivros. Antes disso, tudo o que tinha eram scripts Python desajeitados, escritos à mão.

Sentia-me como um blogueiro de moda que de repente adquiriu habilidades de alfaiataria — ou até mesmo possuía uma fábrica têxtil. Independentemente de quão bom meu gosto era antes, uma vez que aprendi inadvertidamente mais sobre campos relacionados e fundamentais, muitas das minhas visões naturalmente — e inevitavelmente — mudaram.

Decidi passar vários anos me transformando em um engenheiro de computação real.

Já havia feito algo semelhante antes. Ensinei aulas de leitura na New Oriental por muitos anos. Após ensinar por vários anos, pelo menos em leitura, havia efetivamente me transformado em um leitor nativo de inglês (não falante). Minha fala era terrível — mas não havia uso real para ela de qualquer forma — então era isso.

Não estava aspirando a nada grandioso. Apenas queria exercitar meu cérebro. É o jogo mais interessante, não é?

Decidi completar um projeto relativamente pequeno toda semana, e um projeto relativamente maior todo mês. Depois de dezenas de projetos, imaginei que me tornaria uma pessoa diferente.

Três meses depois, havia construído mais de uma dúzia de projetos — alguns falharam, alguns foram abandonados — mas todos eram fascinantes. Durante esse processo, a IA ficou visivelmente mais inteligente a um ritmo assombroso. Sem um uso denso e prático, você nunca sentiria isso de verdade; na melhor das hipóteses, ouviria sobre isso de segunda mão. Esse sentimento importa, pois moldou diretamente uma filosofia de IA que discutirei mais tarde: **uma crença firme de que a IA continuará ficando mais inteligente**.

Em novembro de 2025, construí um leitor EPUB baseado em foliate.js, projetado exatamente do jeito que eu gostava. Implementei recursos que não conseguia obter no Kindle ou no Apple Books (macOS/iOS): destaques em camadas, gerenciamento de destaques e notas (não apenas exportação), dicionários personalizados, exportação de cartões Obsidian e mais. Havia bugs ocasionais, mas eles não afetavam meu uso pessoal.

Dito isso, estava muito envergonhado para lançá-lo publicamente. A maior lição que aprendi foi: algo construído apenas para você mesmo é um *brinquedo*; algo construído para muitas pessoas é um *produto* ou um *serviço*.

## Por que um Editor Markdown

Naturalmente, ainda estava pensando apenas nas minhas próprias necessidades. Uma vez que "leitura" foi resolvida, a próxima coisa que eu poderia resolver para mim mesmo era "escrita". Então, em 27 de dezembro de 2025 — depois de retornar a Pequim de Harbin após o Natal — comecei a construir o **VMark**. O nome simplesmente significa *Vibe-coded Markdown Editor*. Até seu ícone foi vibe-coded: o Claude Code instruiu o Sketch via MCP para desenhá-lo.

Escolher construir um editor Markdown tinha outras razões também.

> - Sentia que tinha uma ideia bastante clara de como um editor Markdown *deveria ser*.
>
> - Também tinha muitas necessidades não atendidas que os editores existentes não conseguiam satisfazer.
>
> - Intuitivamente, parecia um projeto do tamanho certo para mim neste estágio — um projeto de "médio porte" que eu poderia realisticamente lidar.
>
> - Também acreditava que tal projeto me permitiria a IA me ajudar mais. Afinal, um editor Markdown não é novidade; cada detalhe dele é algo que a IA entende melhor do que quase qualquer pessoa.

E então cai num buraco — muito fundo. Um editor Markdown verdadeiramente bom é extremamente difícil de construir, muito mais complexo do que eu havia imaginado.

Fiquei superficialmente feliz por alguns dias, depois passei uma semana lutando repetidamente e me sentindo abatido. Eventualmente, perguntei ao ChatGPT:

> Qual é a carga de trabalho para construir um editor Markdown realmente bom?

A abertura de sua resposta me fez rir — da minha própria ignorância.

> - Um editor Markdown utilizável: **1 pessoa · 1–2 semanas**
>
> - Um editor Markdown bom: **1–2 pessoas · 1–3 meses**
>
> - Um editor Markdown que escritores intensivos não conseguem viver sem:\
>   **3–8 pessoas · 1–3 anos** (e essencialmente um projeto em evolução contínua)
>
> - (Muitos detalhes omitidos.)
>
> - Então veio a pergunta final:\
>   *Por quanto tempo você está disposto a mantê-lo (em anos, não meses)?*

Isso na verdade me tranquilizou. Manutenção medida em *anos*? Isso pode ser um problema para outros, mas não para mim. Não tenho medo disso. Também tive uma pequena percepção: o Markdown é provavelmente o formato mais fundamental para a futura interação humano-computador. Vou usá-lo mais ao longo do tempo. Se for assim, por que não mantê-lo indefinidamente?

Como nota à parte, durante esse processo descobri que o Typora — um editor que usei e paguei por múltiplas licenças ao longo de muitos anos — é na verdade desenvolvido por uma empresa com sede em Xangai.

Duas semanas depois, o VMark tinha uma forma básica. Um mês completo depois, em 27 de janeiro de 2026, mudei seu rótulo de *alpha* para *beta*.

## Um Editor com Opiniões

O VMark é **altamente opinativo**. Na verdade, suspeito que todo software e serviços codificados com vibe sejam assim. Isso é inevitável, porque o vibe coding é inerentemente um processo de produção sem reuniões — apenas eu e um executor que nunca retruca.

Aqui estão algumas das minhas preferências pessoais:

> - Todas as informações que não são conteúdo devem ficar fora da área principal. Mesmo o menu de formatação é colocado na parte inferior.
>
> - Tenho preferências tipográficas teimosas.
>
> - Caracteres chineses devem ter espaçamento entre eles, mas letras latinas embutidas em texto chinês não devem. Antes do VMark, nenhum editor satisfazia esse requisito de nicho, comercialmente sem valor.
>
> - O espaçamento entre linhas deve ser ajustável a qualquer momento.
>
> - As tabelas devem ter cor de fundo apenas na linha de cabeçalho. Odeio listas zebradas.
>
> - Tabelas e imagens devem ser centralizáveis.
>
> - Apenas os títulos H1 devem ter sublinhados.

Alguns recursos normalmente encontrados apenas em editores de código devem existir:

> - Modo de múltiplos cursores
>
> - Ordenação de múltiplas linhas
>
> - Emparelhamento automático de pontuação

Outros são opcionais, mas bons de ter:

> - Escape de Tab à Direita
>
> - Gosto de editores Markdown WYSIWYG, mas odeio trocar constantemente de visualização (mesmo que às vezes seja necessário). Então projetei um recurso *Source Peek* (F5), permitindo visualizar e editar a fonte do bloco atual sem trocar toda a visualização.
>
> - Exportar PDF não é tão importante. Exportar HTML dinâmico é.

E assim por diante.

## Erros e Avanços

Durante o desenvolvimento, cometi inúmeros erros, incluindo mas não se limitando a:

> - Implementar recursos complexos muito cedo, inflando desnecessariamente o escopo
>
> - Gastar tempo em recursos que foram posteriormente removidos
>
> - Hesitar entre caminhos, reiniciando repetidas vezes
>
> - Seguir um caminho por tempo demais antes de perceber que faltavam princípios orientadores

Em suma, cometi todos os erros que um engenheiro imaturo pode cometer — muitas vezes. Um resultado foi que da manhã até a noite, ficava olhando para uma tela quase sem parar. Doloroso, mas alegre.

É claro que havia coisas que fiz certo.

Por exemplo, adicionei um servidor MCP ao VMark antes mesmo de seus recursos principais estarem sólidos. Isso permitiu que a IA enviasse conteúdo diretamente para o editor. Eu podia simplesmente pedir ao Claude Code no terminal:

> "Forneça conteúdo Markdown para testar este recurso, com cobertura abrangente de casos extremos."

Toda vez, o conteúdo de teste gerado me surpreendia — e economizava enormes quantidades de tempo e energia.

No início, não tinha ideia do que o MCP realmente era. Só vim a entendê-lo profundamente depois de clonar um servidor MCP e modificá-lo em algo completamente não relacionado ao VMark — levando a outro projeto chamado **CCCMemory**. Vibe learning, de fato.

No uso real, ter MCP em um editor Markdown é incrivelmente útil — especialmente para desenhar diagramas Mermaid. Ninguém os entende melhor do que a IA. O mesmo vale para expressões regulares. Agora peço rotineiramente à IA para enviar sua saída — relatórios de análise, relatórios de auditoria — diretamente para o VMark. É muito mais confortável do que lê-los em um terminal ou VSCode.

Em 2 de fevereiro de 2026 — exatamente um ano após o nascimento do conceito de vibe coding — senti que o VMark havia se tornado uma ferramenta que eu podia usar confortavelmente de verdade. Ainda tinha muitos bugs, mas eu já havia começado a escrever com ele diariamente, corrigindo bugs ao longo do caminho.

Até adicionei um painel de linha de comando e Gênios de IA (honestamente, ainda não muito utilizáveis, devido às peculiaridades dos diferentes provedores de IA). Ainda assim, estava claramente em um caminho onde continuava melhorando para mim — e onde eu não conseguia mais usar outros editores Markdown.

## Git é Obrigatório

Seis semanas depois, senti que havia alguns detalhes que valiam ser compartilhados com outros "não-engenheiros" como eu.

Primeiro, embora eu não seja um engenheiro de verdade, felizmente entendo operações básicas de **git**. Usei git por muitos anos, mesmo que pareça uma ferramenta que apenas engenheiros usam. Olhando para trás, acho que registrei minha conta no GitHub há cerca de 15 anos.

Raramente uso recursos avançados do git. Por exemplo, não uso git worktree como recomendado pelo Claude Code. Em vez disso, uso duas máquinas separadas. Uso apenas comandos básicos, todos emitidos via instruções em linguagem natural para o Claude Code.

Tudo acontece em branches. Eu me envolvo livremente, depois digo:

> "Resuma as lições aprendidas até agora, redefina o branch atual e vamos começar de novo."

Sem git, você simplesmente não pode fazer nenhum projeto não trivial. Isso é especialmente importante para não-programadores: *aprender conceitos básicos de git é obrigatório*. Você naturalmente aprenderá mais apenas observando o Claude Code trabalhar.

Segundo, você deve entender o fluxo de trabalho **TDD**. Faça tudo o que puder para melhorar a cobertura de testes. Entenda o conceito de *testes como fronteiras*. Bugs são inevitáveis — como gorgulhos em um celeiro. Sem cobertura de testes suficiente, você não tem chance de encontrá-los.

## Vibe Thinking, Não Vibe Coding

Aqui está o princípio filosófico central: **você não está fazendo vibe coding; você está fazendo vibe thinking**. Produtos e serviços são sempre o resultado do *pensamento*, não o resultado inevitável do *trabalho braçal*.

A IA assumiu muito do "*fazer*", mas só pode auxiliar no pensamento fundamental do *quê*, *por quê* e *como*. O perigo é que ela sempre seguirá seu lead. Se você depender dela para pensar, ela silenciosamente o aprisionará dentro de seus próprios vieses cognitivos[^2] — enquanto o faz sentir mais livre do que nunca. Como diz a letra:

> *"We are all just prisoners here, of our own device."*

O que frequentemente digo à IA é:

> "Trate-me como um rival de quem você não gosta particularmente. Avalie minhas ideias criticamente e as desafie diretamente, mas mantenha-se profissional e não hostil."

> Os resultados são consistentemente de alta qualidade e inesperados.

Outra técnica é deixar as IAs de diferentes fornecedores debaterem entre si.[^3] Instalei o serviço MCP do Codex CLI para o Claude Code. Frequentemente digo ao Claude Code:

> "Resuma os problemas que você não conseguiu resolver agora e peça ajuda ao Codex."

Ou envio o plano do Claude Code para o Codex CLI:

> "Este é o plano elaborado pelo Claude Code. Quero seu feedback mais profissional, direto e implacável."

Então passo a resposta do Codex de volta ao Claude Code.

Quando descobri o comando `/audit` do Claude Code (por volta do início de outubro), imediatamente escrevi `/codex-audit` — um clone que usa MCP para chamar o Codex CLI. Usar IA para pressionar e auditar IA funciona muito melhor do que fazê-lo eu mesmo.

Essa abordagem é essencialmente uma variante de *recursão* — o mesmo princípio por trás de perguntar ao Google "como usar o Google efetivamente". Por isso não gasto muito tempo em engenharia de prompts complexa. Se você entende recursão, resultados melhores são inevitáveis.

## Somente Terminal

Há também um fator de personalidade. Engenheiros devem genuinamente gostar de **lidar com detalhes**. Caso contrário, o trabalho se torna miserável. Cada detalhe contém inúmeros sub-detalhes.

Por exemplo: aspas curvas vs aspas retas; o quanto as aspas curvas são perceptíveis depende das fontes latinas em vez das fontes CJK (algo que eu nunca sabia antes do VMark); se as aspas se auto-emparelham, as aspas duplas direitas também devem se auto-emparelhar (um detalhe que notei enquanto escrevia este próprio artigo); enquanto isso, as aspas simples curvas direitas *não* devem se auto-emparelhar. Se lidar com esses detalhes não te deixa feliz, o desenvolvimento de produto inevitavelmente se tornará entediante, frustrante e até irritante.

Finalmente, há mais uma escolha altamente opinativa que vale mencionar. Como não sou um engenheiro, escolhi o que acredito ser o caminho mais correto por necessidade:

**Não uso nenhum IDE** — **apenas o terminal.**

No início, usei o Terminal macOS padrão. Mais tarde, mudei para o iTerm para abas e painéis divididos.

Por que abandonar IDEs como o VSCode? Inicialmente, porque eu não conseguia entender código complexo — e o Claude Code frequentemente fazia o VSCode travar. Mais tarde, percebi que não precisava entender. O código escrito por IA é vastamente melhor do que o que eu — ou mesmo programadores que eu poderia contratar (os cientistas da OpenAI não são pessoas que você pode contratar) — poderia escrever. Se eu não leio o código, não há necessidade de ler diffs também.

Eventualmente, parei de escrever documentação por conta própria (orientação ainda é necessária). O site inteiro [vmark.app](https://vmark.app) foi escrito por IA; não toquei em um único caractere — exceto pelas reflexões sobre o próprio vibe coding.

É semelhante a como eu invisto: *posso* ler demonstrações financeiras, mas nunca o faço — boas empresas são óbvias sem elas. O que importa é a direção, não os detalhes.

É por isso que o site VMark inclui este crédito:

<img src="./images/vmark-credits.png" alt="Créditos VMark — Produtor e Programadores" style="max-width: 480px;" />

Outra consequência de ser altamente opinativo: mesmo que o VMark seja de código aberto, contribuições da comunidade são improváveis. É construído puramente para o meu próprio fluxo de trabalho; muitos recursos têm pouco valor para outros. Mais importante, um editor Markdown não é tecnologia de ponta. É uma das inúmeras implementações de uma ferramenta familiar. A IA pode resolver praticamente qualquer problema relacionado a ele.

O Claude Code pode até ler issues do GitHub, corrigir bugs e responder automaticamente no idioma do reportante. A primeira vez que vi ele lidar com um issue do início ao fim, fiquei completamente perplexo.

## O Teste Decisivo

Construir o VMark também me fez pensar sobre as implicações mais amplas da IA para o aprendizado. Toda educação deve ser orientada para a produção[^4] — o futuro pertence a criadores, pensadores e tomadores de decisão, enquanto a execução pertence às máquinas. O teste decisivo mais importante para qualquer pessoa que usa IA:

> Depois de começar a usar IA, você está pensando **mais**, ou **menos**?

Se você está pensando mais — e pensando mais profundamente — então a IA está te ajudando da maneira certa. Se você está pensando menos, então a IA está produzindo efeitos colaterais.[^5]

Além disso, a IA nunca é uma ferramenta para "fazer menos trabalho". A lógica é simples: porque ela pode fazer mais coisas, você pode pensar mais e ir mais fundo. Como resultado, as coisas que você *pode* fazer — e *precisa* fazer — só **aumentarão**, não diminuirão.[^6]

Enquanto escrevia este artigo, casualmente descobri vários pequenos problemas. Como resultado, o número de versão do VMark foi de **0.4.12** para **0.4.13**.

E como comecei a viver principalmente na linha de comando, não sinto mais nenhuma necessidade de um monitor grande ou múltiplas telas. Um laptop de 13 polegadas é completamente suficiente. Até uma pequena varanda pode se tornar um espaço de trabalho "suficiente".

[^1]: Um ensaio clínico randomizado da METR descobriu que desenvolvedores experientes de código aberto (com média de 5 anos em seus projetos atribuídos) eram na verdade **19% mais lentos** ao usar ferramentas de IA, apesar de prever um aumento de velocidade de 24%. O estudo destaca uma lacuna entre ganhos de produtividade percebidos e reais — a IA ajuda mais quando amplifica habilidades existentes, não quando substitui habilidades ausentes. Ver: Rao, A., Brokman, J., Wentworth, A., et al. (2025). [Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity](https://arxiv.org/abs/2507.09089). *METR Technical Report*.

[^2]: LLMs treinados com feedback humano concordam sistematicamente com as crenças existentes dos usuários em vez de fornecer respostas verdadeiras — um comportamento que os pesquisadores chamam de *sycophancy*. Em cinco assistentes de IA de última geração e quatro tarefas de geração de texto, os modelos consistentemente adaptaram respostas para corresponder às opiniões dos usuários, mesmo quando essas opiniões eram incorretas. Quando um usuário meramente sugeria uma resposta incorreta, a precisão do modelo caía significativamente. Esta é exatamente a "armadilha de viés cognitivo" descrita acima: a IA segue seu lead em vez de desafiá-lo. Ver: Sharma, M., Tong, M., Korbak, T., et al. (2024). [Towards Understanding Sycophancy in Language Models](https://arxiv.org/abs/2310.13548). *ICLR 2024*.

[^3]: Esta técnica espelha uma abordagem de pesquisa chamada *debate multi-agente*, onde múltiplas instâncias de LLM propõem e desafiam as respostas umas das outras ao longo de várias rodadas. Mesmo quando todos os modelos inicialmente produzem respostas incorretas, o processo de debate melhora significativamente a factualidade e a precisão do raciocínio. Usar modelos de diferentes fornecedores (com diferentes dados de treinamento e arquiteturas) amplifica esse efeito — seus pontos cegos raramente se sobrepõem. Ver: Du, Y., Li, S., Torralba, A., Tenenbaum, J.B., & Mordatch, I. (2024). [Improving Factuality and Reasoning in Language Models through Multiagent Debate](https://arxiv.org/abs/2305.14325). *ICML 2024*.

[^4]: Isso se alinha com a teoria do *construcionismo* de Seymour Papert — a ideia de que a aprendizagem é mais eficaz quando os aprendizes estão ativamente construindo artefatos significativos em vez de absorver informações passivamente. Papert, aluno de Piaget, argumentou que construir produtos tangíveis (software, ferramentas, obras criativas) envolve processos cognitivos mais profundos do que a instrução tradicional. John Dewey fez um argumento semelhante um século antes: a educação deve ser experiencial e conectada à resolução de problemas do mundo real em vez de memorização mecânica. Ver: Papert, S. & Harel, I. (1991). [Constructionism](https://web.media.mit.edu/~calla/web_comunidad/Reading-En/situating_constructionism.pdf). *Ablex Publishing*; Dewey, J. (1938). *Experience and Education*. Kappa Delta Pi.

[^5]: Um estudo de 2025 com 666 participantes encontrou uma forte correlação negativa entre o uso frequente de ferramentas de IA e as habilidades de pensamento crítico (r = −0,75), mediada pelo *offloading cognitivo* — a tendência de delegar o pensamento a ferramentas externas. Quanto mais os participantes dependiam da IA, menos engajavam suas próprias faculdades analíticas. Participantes mais jovens mostraram maior dependência de IA e pontuações mais baixas de pensamento crítico. Ver: Gerlich, M. (2025). [AI Tools in Society: Impacts on Cognitive Offloading and the Future of Critical Thinking](https://www.mdpi.com/2075-4698/15/1/6). *Societies*, 15(1), 6.

[^6]: Esta é uma instância moderna do *paradoxo de Jevons* — a observação de 1865 de que motores a vapor mais eficientes não reduziram o consumo de carvão, mas o aumentaram, porque custos mais baixos estimularam maior demanda. Aplicado à IA: à medida que codificação e escrita se tornam mais baratas e rápidas, o volume total de trabalho se expande em vez de se contrair. Dados recentes apoiam isso — a demanda por engenheiros de software fluentes em IA aumentou quase 60% ano a ano em 2025, com prêmios de remuneração de 15–25% para desenvolvedores proficientes em ferramentas de IA. Ganhos de eficiência criam novas possibilidades, que criam novo trabalho. Ver: Jevons, W.S. (1865). *The Coal Question*; [The Productivity Paradox of AI](https://www.hackerrank.com/blog/the-productivity-paradox-of-ai/), HackerRank Blog (2025).
