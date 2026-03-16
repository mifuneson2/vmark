# Perché Accettiamo Issue, Non Pull Request

VMark non accetta pull request. Accogliamo le issue — più dettagliate, meglio è. Questa pagina spiega perché.

## La Versione Breve

VMark è realizzato con vibe coding. L'intero codebase è scritto dall'IA sotto la supervisione di un unico maintainer. Quando qualcuno invia una pull request, c'è un problema fondamentale: **un essere umano non può esaminare significativamente il codice generato dall'IA di un altro**. Il revisore non capisce il codice del contributore perché nessuno dei due lo ha scritto nel senso tradizionale — lo hanno fatto le loro IA.

Le issue non hanno questo problema. Una issue ben scritta descrive *cosa* dovrebbe succedere. L'IA del maintainer corregge quindi il codebase con piena conoscenza delle convenzioni del progetto, della suite di test e dell'architettura. Il risultato è coerente, testato e manutenibile.

## Cosa Significa Davvero "Vibe-Coded"

Il termine "vibe coding" è stato coniato da Andrej Karpathy all'inizio del 2025 per descrivere uno stile di programmazione in cui descrivi quello che vuoi in linguaggio naturale e lasci che un'IA scriva il codice. Guidi la direzione, ma non stai scrivendo — o spesso nemmeno leggendo — ogni riga.[^1]

VMark porta questo oltre la maggior parte dei progetti. Il repository viene fornito con:

- **`AGENTS.md`** — Regole del progetto che ogni strumento AI legge all'avvio
- **`.claude/rules/`** — Più di 15 file di regole che coprono TDD, token di design, pattern di componenti, accessibilità e altro
- **Comandi slash** — Flussi di lavoro pre-costruiti per auditare, correggere e verificare il codice
- **Verifica cross-model** — Claude scrive, Codex audita (vedi [Verifica Cross-Model](/it/guide/users-as-developers/cross-model-verification))

L'IA non genera solo codice casuale. Opera all'interno di una fitta rete di vincoli — convenzioni, test e controlli automatizzati — che mantengono il codebase coerente. Ma questo funziona solo quando **una sessione AI ha il pieno contesto** di quei vincoli.

## Il Divario di Comprensione

Ecco il problema centrale con le pull request generate dall'IA: nessuno le legge completamente.

Una ricerca dalla conferenza Foundations of Software Engineering dell'ACM ha scoperto che gli sviluppatori — specialmente quelli che non hanno scritto il codice da soli — faticano a capire il codice generato da LLM. Lo studio, intitolato *"I Would Have Written My Code Differently": Beginners Struggle to Understand LLM-Generated Code*, ha documentato come persino sviluppatori tecnicamente capaci abbiano difficoltà a ragionare su codice che non hanno creato quando l'ha scritto un'IA.[^2]

Questo non è solo un problema per principianti. Un'analisi del 2025 di oltre 500.000 pull request da CodeRabbit ha scoperto che le PR generate dall'IA contengono **1,7 volte più problemi** rispetto alle PR scritte da umani — inclusi il 75% in più di errori di logica e correttezza. La preoccupazione maggiore? Questi sono precisamente gli errori che sembrano ragionevoli durante la revisione a meno che non si analizzi il codice passo per passo.[^3]

La matematica peggiora quando entrambe le parti usano l'IA:

| Scenario | Il revisore capisce il codice? |
|----------|-------------------------------|
| Umano scrive, umano rivede | Sì — il revisore può ragionare sull'intento |
| IA scrive, autore originale rivede | Parzialmente — l'autore ha guidato l'IA e ha contesto |
| IA scrive, umano diverso rivede | Mal — il revisore non ha né contesto di authorship né di sessione AI |
| IA scrive per persona A, IA rivede per persona B | Nessuno degli umani capisce il codice in profondità |

VMark si trova nell'ultima riga. Quando un contributore apre una PR generata dalla sua IA, e l'IA del maintainer la rivede, i due umani nel ciclo hanno la comprensione minima di qualsiasi scenario. Questa non è una ricetta per software di qualità.

## Perché le PR Generate dall'IA Sono Diverse da Quelle Umane

La revisione del codice tradizionale funziona grazie a una base condivisa: sia l'autore che il revisore capiscono il linguaggio di programmazione, i pattern e gli idiomi. Il revisore può simulare mentalmente l'esecuzione del codice e individuare le incongruenze.

Con il codice generato dall'IA, quella base condivisa si erode. La ricerca mostra diversi specifici modi di fallire:

**Convention drift.** L'IA ha una "tendenza schiacciante a non capire quali siano le convenzioni esistenti all'interno di un repository", generando la propria versione leggermente diversa di come risolvere un problema.[^4] La sessione AI di ogni contributore produce codice che funziona in isolamento ma si scontra con i pattern del progetto. In VMark, dove applichiamo specifici pattern di store Zustand, utilizzo di token CSS e strutture di plugin, il convention drift sarebbe devastante.

**Isolamento del contesto.** Le funzionalità realizzate con vibe coding sono spesso "generate in isolamento, dove l'IA crea implementazioni ragionevoli per ogni prompt ma non ha memoria delle decisioni architetturali di sessioni precedenti."[^5] L'IA di un contributore non conosce i 15 file di regole di VMark, la sua pipeline di audit cross-model o le sue specifiche convenzioni di plugin ProseMirror — a meno che il contributore non abbia configurato tutto meticolosamente.

**Collo di bottiglia della revisione.** Gli sviluppatori che usano l'IA completano il 21% in più di attività e uniscono il 98% in più di pull request, ma il tempo di revisione delle PR aumenta del 91%.[^6] La velocità di generazione del codice AI crea un diluvio di codice che sopraffà la capacità di revisione umana. Per un maintainer solitario, questo è insostenibile.

## Il Precedente di SQLite

VMark non è il primo progetto a limitare i contributi. SQLite — una delle librerie software più diffuse al mondo — è stata "open source, non open contribution" per tutta la sua storia. Il progetto non accetta patch da persone casuali su Internet. I contributori possono suggerire modifiche e includere codice proof-of-concept, ma gli sviluppatori principali tipicamente riscrivono le patch da zero.[^7]

Il ragionamento di SQLite è diverso (devono mantenere lo status di dominio pubblico), ma il risultato è lo stesso: **la qualità è mantenuta avendo un singolo team con pieno contesto** che scrive tutto il codice. I contributi esterni sono convogliati attraverso segnalazioni di bug e suggerimenti di funzionalità piuttosto che modifiche dirette al codice.

Altri progetti notevoli hanno adottato posizioni simili. Il modello Benevolent Dictator for Life (BDFL) — usato storicamente da Python (Guido van Rossum), Linux (Linus Torvalds) e molti altri — concentra l'autorità finale in una persona che garantisce la coerenza architetturale.[^8] VMark rende semplicemente questo esplicito: il "dittatore" è l'IA, supervisionata dal maintainer.

## Perché le Issue Funzionano Meglio

Una issue è una **specifica**, non un'implementazione. Descrive cosa c'è di sbagliato o cosa è necessario, senza impegnarsi in una soluzione particolare. Questa è un'interfaccia migliore tra i contributori e un codebase mantenuto dall'IA:

| Tipo di contributo | Cosa fornisce | Rischio |
|-------------------|----------------|---------|
| Pull request | Codice che devi capire, rivedere, testare e mantenere | Convention drift, perdita di contesto, onere di revisione |
| Issue | Una descrizione del comportamento desiderato | Nessuno — il maintainer decide se e come agire |

### Cosa rende una issue eccellente

Le migliori issue si leggono come documenti di requisiti:

1. **Comportamento attuale** — Cosa accade ora (con passaggi per riprodurre i bug)
2. **Comportamento atteso** — Cosa dovrebbe accadere invece
3. **Contesto** — Perché è importante, cosa stavi cercando di fare
4. **Ambiente** — OS, versione di VMark, impostazioni rilevanti
5. **Screenshot o registrazioni** — Quando è coinvolto un comportamento visivo

Sei libero di usare l'IA per scrivere issue. In realtà, ti incoraggiamo a farlo. Un assistente AI può aiutarti a strutturare una issue dettagliata e ben organizzata in pochi minuti. L'ironia è intenzionale: **l'IA è brava a descrivere chiaramente i problemi, e l'IA è brava a risolvere problemi chiaramente descritti.** Il collo di bottiglia è il mezzo confuso — capire la soluzione generata dall'IA di qualcun altro — che le issue aggirano elegantemente.

### Cosa succede dopo che hai aperto una issue

1. Il maintainer legge e triage la issue
2. All'IA viene fornita la issue come contesto, insieme alla piena conoscenza del codebase
3. L'IA scrive una correzione seguendo TDD (test prima, poi implementazione)
4. Un secondo modello AI (Codex) audita la correzione indipendentemente
5. I gate automatizzati vengono eseguiti (`pnpm check:all` — lint, test, copertura, build)
6. Il maintainer rivede la modifica nel contesto e fa il merge

Questa pipeline produce codice che è:
- **Conforme alle convenzioni** — L'IA legge i file delle regole ad ogni sessione
- **Testato** — Il TDD è obbligatorio; le soglie di copertura sono applicate
- **Verificato in modo incrociato** — Un secondo modello audita per errori di logica, sicurezza e codice morto
- **Architetturalmente coerente** — Una sessione AI con pieno contesto, non frammenti da molte

## Il Quadro Generale

L'era AI sta forzando un ripensamento di come funziona il contributo open source. Il modello tradizionale — fork, branch, codice, PR, revisione, merge — assumeva che gli umani scrivessero il codice e che altri umani potessero leggerlo. Quando l'IA genera il codice, entrambe le assunzioni si indeboliscono.

Un sondaggio del 2025 di sviluppatori professionisti ha scoperto che "non fanno vibe coding; invece, controllano attentamente gli agenti attraverso la pianificazione e la supervisione."[^9] L'enfasi è sul **controllo e il contesto** — esattamente ciò che si perde quando una PR arriva dalla sessione AI non correlata di un contributore esterno.

Crediamo che il futuro dell'open source nell'era AI sembri diverso:

- **Le issue diventano il contributo principale** — Descrivere i problemi è una competenza universale
- **I maintainer controllano l'IA** — Un team con pieno contesto produce codice coerente
- **La verifica cross-model sostituisce la revisione umana** — L'audit AI avversariale cattura ciò che gli umani mancano
- **I test sostituiscono la fiducia** — I gate automatizzati, non il giudizio del revisore, determinano se il codice è corretto

VMark sta sperimentando questo modello apertamente. Potrebbe non essere l'approccio giusto per ogni progetto. Ma per un codebase realizzato con vibe coding mantenuto da una persona con strumenti AI, è l'approccio che produce il software migliore.

## Come Contribuire

**Apri una issue.** Punto. Più dettagli fornisci, migliore sarà la correzione.

- **[Segnalazione Bug](https://github.com/xiaolai/vmark/issues/new?template=bug_report.yml)**
- **[Richiesta Funzionalità](https://github.com/xiaolai/vmark/issues/new?template=feature_request.yml)**

La tua issue diventa la specifica dell'IA. Una issue chiara porta a una correzione corretta. Una issue vaga porta a scambi. Investi nella descrizione — determina direttamente la qualità del risultato.

---

[^1]: Karpathy, A. (2025). [Vibe coding](https://en.wikipedia.org/wiki/Vibe_coding). Originariamente descritto in un post sui social media, il termine è rapidamente entrato nel vocabolario mainstream degli sviluppatori. Wikipedia nota che il vibe coding "si affida a strumenti AI per generare codice da prompt in linguaggio naturale, riducendo o eliminando la necessità che lo sviluppatore scriva codice manualmente."

[^2]: Jury, J. et al. (2025). ["I Would Have Written My Code Differently": Beginners Struggle to Understand LLM-Generated Code](https://dl.acm.org/doi/pdf/10.1145/3696630.3731663). *FSE Companion '25*, 33a Conferenza Internazionale ACM sui Fondamenti dell'Ingegneria del Software. Lo studio ha scoperto che gli sviluppatori che non hanno creato il prompt AI avevano difficoltà significative a capire e ragionare sul codice generato.

[^3]: CodeRabbit. (2025). [AI-Assisted Pull Requests Report](https://www.helpnetsecurity.com/2025/12/23/coderabbit-ai-assisted-pull-requests-report/). Analisi di 500.000+ pull request ha trovato che le PR generate dall'IA contengono 10,83 problemi ciascuna vs. 6,45 nelle PR umane (1,7x di più), con il 75% in più di errori di logica e correttezza e 1,4x più problemi critici.

[^4]: Osmani, A. (2025). [Code Review in the Age of AI](https://addyo.substack.com/p/code-review-in-the-age-of-ai). Analisi di come il codice generato dall'IA interagisce con i codebase esistenti, notando la tendenza dell'IA a creare pattern inconsistenti che si discostano dalle convenzioni del progetto stabilite.

[^5]: Weavy. (2025). [You Can't Vibe Code Your Way Out of a Vibe Coding Mess](https://www.weavy.com/blog/you-cant-vibe-code-your-way-out-of-a-vibe-coding-mess). Documenta come le funzionalità realizzate con vibe coding generate in sessioni AI isolate creino conflitti architetturali quando combinate, perché ogni sessione manca di consapevolezza delle decisioni prese in altre sessioni.

[^6]: SoftwareSeni. (2025). [Why AI Coding Speed Gains Disappear in Code Reviews](https://www.softwareseni.com/why-ai-coding-speed-gains-disappear-in-code-reviews/). Riporta che mentre gli sviluppatori assistiti dall'AI completano il 21% in più di attività e uniscono il 98% in più di PR, il tempo di revisione delle PR aumenta del 91% — rivelando che l'IA sposta il collo di bottiglia dalla scrittura alla revisione.

[^7]: SQLite. [SQLite Copyright](https://sqlite.org/copyright.html). SQLite è stato "open source, non open contribution" fin dalla sua nascita. Il progetto non accetta patch da contributori esterni per mantenere lo status di dominio pubblico e la qualità del codice. I contributori possono suggerire modifiche, ma il team principale riscrive le implementazioni da zero.

[^8]: Wikipedia. [Benevolent Dictator for Life](https://en.wikipedia.org/wiki/Benevolent_dictator_for_life). Il modello di governance BDFL, usato da Python, Linux e molti altri progetti, concentra l'autorità architetturale in una persona per mantenere la coerenza. BDFL notabili includono Guido van Rossum (Python), Linus Torvalds (Linux) e Larry Wall (Perl).

[^9]: Dang, H.T. et al. (2025). [Professional Software Developers Don't Vibe, They Control: AI Agent Use for Coding in 2025](https://arxiv.org/html/2512.14012). Sondaggio di sviluppatori professionisti ha scoperto che mantengono un controllo stretto sugli agenti AI attraverso la pianificazione e la supervisione, piuttosto che adottare l'approccio hands-off del "vibe coding".
