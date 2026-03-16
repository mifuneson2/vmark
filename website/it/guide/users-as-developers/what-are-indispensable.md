# Cinque Competenze Umane Fondamentali che Potenziano l'IA

Non hai bisogno di una laurea in informatica per costruire software con strumenti di codifica AI. Ma hai bisogno di un piccolo insieme di competenze che nessuna IA può sostituire. Queste sono le fondamenta indispensabili — le cose che rendono possibile tutto il resto.

## La Lista Breve

| Competenza | Perché È Indispensabile |
|-----------|------------------------|
| **Git** | La tua rete di sicurezza — annulla qualsiasi cosa, sperimenta senza paura, non perdere mai il lavoro |
| **TDD** | La metodologia che mantiene onesto il codice generato dall'IA |
| **Alfabetizzazione nel terminale** | Gli strumenti AI vivono nel terminale; devi leggere il loro output |
| **Inglese** | Documentazione, errori e prompt AI funzionano meglio in inglese |
| **Gusto** | L'IA genera opzioni; tu decidi quale è quella giusta |

Ecco tutto. Cinque cose. Tutto il resto — sintassi del linguaggio, API dei framework, pattern di design — lo gestisce l'IA.[^1]

## Git — La Tua Rete di Sicurezza

Git è lo strumento singolarmente più importante nel tuo arsenale. Non perché tu abbia bisogno di padroneggiare il rebase o il cherry-picking — l'IA si occupa di quello — ma perché Git ti dà **sperimentazione senza paura**.[^2]

### Cosa Devi Davvero Sapere

| Comando | Cosa Fa | Quando Lo Usi |
|---------|---------|----------------|
| `git status` | Mostra cosa è cambiato | Prima e dopo ogni sessione AI |
| `git diff` | Mostra le modifiche esatte | Rivedi cosa ha scritto l'IA prima di fare commit |
| `git add` + `git commit` | Salva un checkpoint | Dopo ogni stato funzionante |
| `git log` | Cronologia delle modifiche | Quando devi capire cosa è successo |
| `git stash` | Metti da parte temporaneamente le modifiche | Quando vuoi provare un approccio diverso |
| `git checkout -- file` | Annulla le modifiche a un file | Quando l'IA ha peggiorato qualcosa |
| `git worktree` | Lavora su più branch contemporaneamente | Quando vuoi esplorare idee in parallelo |

### Il Modello Mentale

Pensa a Git come **annullamento infinito**. Ogni commit è un punto di salvataggio a cui puoi tornare. Questo significa:

- **Prova modifiche rischiose liberamente** — puoi sempre tornare indietro
- **Lascia sperimentare l'IA** — se rompe qualcosa, fai rollback
- **Lavora su più idee** — i branch ti permettono di esplorare in parallelo
- **Revisiona prima di accettare** — `git diff` ti mostra esattamente cosa ha cambiato l'IA

L'IA creerà commit, branch e pull request per te. Ma dovresti capire cosa sono, perché sei tu a decidere quando salvare, quando fare branch e quando fare merge.

### Git Worktrees — Universi Paralleli

Una funzionalità Git che vale la pena imparare presto è i **worktree**. Un worktree ti permette di fare checkout di un branch diverso in una directory separata — senza cambiare il tuo lavoro corrente:

```bash
# Crea un worktree per una nuova funzionalità
git worktree add ../my-feature -b feature/new-idea

# Lavora in esso
cd ../my-feature
claude    # avvia una sessione AI in questo branch

# Torna al tuo lavoro principale — intatto
cd ../vmark
```

Questo è particolarmente potente con gli strumenti di codifica AI: puoi avere una sessione AI che sperimenta su un feature branch mentre il tuo branch principale rimane pulito e funzionante. Se l'esperimento fallisce, elimina semplicemente la directory del worktree. Nessun disordine, nessun rischio.

::: warning Non Saltare Git
Senza Git, una singola modifica AI errata può rovinare ore di lavoro senza possibilità di tornare indietro. Con Git, il caso peggiore è sempre `git checkout -- .` e sei tornato al tuo ultimo salvataggio. Impara le basi di Git prima di qualsiasi altra cosa.
:::

## TDD — Come Mantieni Onesta l'IA

Il Test-Driven Development è la metodologia che trasforma la codifica AI da "speriamo che funzioni" a "proviamo che funziona." Non è solo una buona pratica — è il tuo meccanismo principale per **verificare** che il codice generato dall'IA faccia effettivamente quello che hai chiesto.[^3]

### Il Ciclo RED-GREEN-REFACTOR

Il TDD segue un rigoroso ciclo in tre fasi:

```
1. RED     — Scrivi un test che descrive cosa vuoi. Fallisce.
2. GREEN   — Chiedi all'IA di scrivere il codice minimo per far passare il test.
3. REFACTOR — Pulisci senza cambiare il comportamento. I test passano ancora.
```

Questo funziona notevolmente bene con gli strumenti di codifica AI perché:

| Fase | Il Tuo Ruolo | Il Ruolo dell'IA |
|------|-------------|-----------------|
| RED | Descrivi il comportamento atteso | Aiuta a scrivere l'asserzione del test |
| GREEN | Verifica che il test passi | Scrivi l'implementazione |
| REFACTOR | Giudica se il codice è abbastanza pulito | Fai la pulizia |

### Perché il TDD è Più Importante con l'IA

Quando scrivi il codice tu stesso, lo capisci implicitamente — sai cosa fa perché l'hai scritto tu. Quando l'IA scrive il codice, hai bisogno di un **meccanismo di verifica esterno**. I test sono quel meccanismo.[^4]

Senza test, ecco cosa succede:

1. Chiedi all'IA di aggiungere una funzionalità
2. L'IA scrive 200 righe di codice
3. Lo leggi, sembra *giusto*
4. Lo distribuisci
5. Rompe qualcosa che non avevi notato — un caso limite sottile, un'incompatibilità di tipi, un errore off-by-one

Con il TDD:

1. Descrivi il comportamento come un test (l'IA ti aiuta a scriverlo)
2. Il test fallisce — confermando che sta testando qualcosa di reale
3. L'IA scrive codice per farlo passare
4. Esegui il test — passa
5. Hai **prova** che funziona, non solo una sensazione

### Come Appare un Test

Non devi scrivere i test da zero. Descrivi cosa vuoi in linguaggio semplice, e l'IA scrive il test. Ma dovresti essere in grado di **leggere** un test:

```ts
// "Quando l'utente salva un documento, il flag di modifica dovrebbe azzerarsi"
it("clears modified flag after save", () => {
  // Setup: marca il documento come modificato
  store.markModified("doc-1");
  expect(store.isModified("doc-1")).toBe(true);

  // Azione: salva il documento
  store.save("doc-1");

  // Verifica: il flag di modifica è azzerato
  expect(store.isModified("doc-1")).toBe(false);
});
```

Il pattern è sempre lo stesso: **setup**, **azione**, **verifica**. Una volta che riconosci questo pattern, puoi leggere qualsiasi test — e, cosa più importante, puoi dire all'IA cosa testare dopo.

### Casi Limite — Dove Vivono i Bug

Il vero potere del TDD è nei **casi limite** — gli input insoliti e le condizioni al limite dove si nascondono i bug. L'IA è sorprendentemente cattiva nel pensarci da sola.[^5] Ma puoi guidarla:

> "Cosa succede se il nome del file è vuoto?"
> "Cosa succede se l'utente fa doppio clic sul pulsante di salvataggio?"
> "Cosa succede se la rete cade nel mezzo di una richiesta?"
> "Cosa succede con un file con caratteri Unicode nel nome?"

Ognuno di questi diventa un test. Ogni test diventa una garanzia. Più casi limite pensi, più robusto diventa il tuo software. È qui che il **gusto** umano e la **velocità di implementazione** dell'IA si combinano per produrre qualcosa che nessuno dei due potrebbe ottenere da solo.

### TDD in Pratica con l'IA

Ecco un flusso di lavoro reale:

```
Tu:   Aggiungi una funzione che controlla se un nome file è valido.
      Inizia con un test che fallisce.

IA:   [Scrive test] it("rejects empty filenames", () => { ... })
      [Il test fallisce — RED ✓]

Tu:   Ora fallo passare.

IA:   [Scrive isValidFilename()]
      [Il test passa — GREEN ✓]

Tu:   Aggiungi test per: solo spazi, separatori di percorso,
      nomi più lunghi di 255 caratteri, byte null.

IA:   [Scrive 4 test aggiuntivi, alcuni falliscono]
      [Aggiorna la funzione per gestire tutti i casi]
      [Tutti i test passano — GREEN ✓]

Tu:   Bene. Refactoring se necessario.

IA:   [Semplifica la regex, i test continuano a passare — REFACTOR ✓]
```

Non hai scritto una singola riga di codice. Ma hai guidato ogni decisione. I test provano che il codice funziona. E se qualcuno modifica la funzione in seguito, i test catturano le regressioni.

::: tip Il Ratchet della Copertura
VMark applica soglie di copertura dei test — se la copertura scende al di sotto del livello minimo, la build fallisce. Questo significa che ogni nuova funzionalità *deve* avere test. L'IA lo sa e scrive automaticamente i test, ma dovresti verificare che testino un comportamento significativo, non solo righe di codice.
:::

## Alfabetizzazione nel Terminale

Gli strumenti di codifica AI sono programmi a riga di comando. Claude Code, Codex CLI, Gemini CLI — girano tutti in un terminale. Non hai bisogno di memorizzare centinaia di comandi, ma devi sentirti a tuo agio con una manciata:

```bash
cd ~/projects/vmark      # Naviga in una directory
ls                        # Elenca i file
git status                # Vedi cosa è cambiato
git log --oneline -5      # Commit recenti
pnpm install              # Installa le dipendenze
pnpm test                 # Esegui i test
```

L'IA suggerirà ed eseguirà comandi per te. Il tuo compito è **leggere l'output** e capire se le cose sono riuscite o fallite. Un errore del test sembra diverso da un errore di build. Un "permission denied" è diverso da "file not found". Non devi correggere questi problemi da solo — ma devi descrivere quello che vedi in modo che l'IA possa correggerli.

::: tip Inizia Qui
Se non hai mai usato un terminale, inizia con [The Missing Semester](https://missing.csail.mit.edu/) del MIT — in particolare la prima lezione sugli strumenti shell. Un'ora di pratica ti dà abbastanza per lavorare con gli strumenti di codifica AI.
:::

## Competenza in Inglese

Non si tratta di scrivere prosa perfetta. Si tratta di **comprensione della lettura** — capire messaggi di errore, documentazione e spiegazioni dell'IA. L'intero ecosistema software funziona in inglese:[^6]

- I **messaggi di errore** sono in inglese
- La **documentazione** è scritta prima (e spesso solo) in inglese
- **Stack Overflow**, le issue GitHub e i tutorial sono prevalentemente in inglese
- I **modelli AI performano misurabilmente meglio** con prompt in inglese (vedi [Perché i Prompt in Inglese Producono Codice Migliore](/it/guide/users-as-developers/prompt-refinement))

Non hai bisogno di scrivere con fluidità. Hai bisogno di:

1. **Leggere** un messaggio di errore e capirne il senso generale
2. **Cercare** termini tecnici efficacemente
3. **Descrivere** quello che vuoi all'IA abbastanza chiaramente

Se l'inglese non è la tua prima lingua, il gancio `::` di VMark traduce e raffina automaticamente i tuoi prompt. Ma leggere le risposte dell'IA — che sono in inglese — è qualcosa che farai costantemente.

## Gusto — L'Unica Cosa che l'IA Non Può Sostituire

Questa è la più difficile da definire e la più importante. Il **gusto** è sapere come appare il bene — anche se non riesci ancora a costruirlo da solo.[^7]

Quando l'IA ti offre tre approcci per risolvere un problema, il gusto è ciò che ti dice:

- Quello semplice è meglio di quello ingegnoso
- La soluzione con meno dipendenze è preferibile
- Il codice che si legge come prosa batte il codice "ottimizzato"
- Una funzione di 10 righe è sospetta se 5 righe basterebbero

### Come Sviluppare il Gusto

1. **Usa software di qualità** — nota cosa sembra giusto e cosa sembra goffo
2. **Leggi codice di qualità** — sfoglia i progetti open source popolari su GitHub
3. **Leggi l'output** — quando l'IA genera codice, leggilo anche se non riesci a scriverlo
4. **Chiedi "perché"** — quando l'IA fa una scelta, chiedi di spiegare i trade-off
5. **Itera** — se qualcosa sembra sbagliato, probabilmente lo è. Chiedi all'IA di riprovare

Il gusto si accumula. Più codice leggi (anche il codice generato dall'IA), migliori diventano i tuoi istinti. Dopo qualche mese di sviluppo assistito dall'IA, individuerai problemi che l'IA manca — non perché conosca più sintassi, ma perché sai come dovrebbe **sembrare il risultato**.

::: tip Il Test del Gusto
Dopo che l'IA ha terminato un'attività, chiediti: "Se fossi un utente, questo sembrerebbe giusto?" Se la risposta non è un sì immediato, di' all'IA cosa non ti convince. Non hai bisogno di conoscere la soluzione — solo la sensazione.
:::

## Cosa Non Hai Bisogno

Altrettanto importante quanto conoscere le fondamenta è sapere cosa puoi tranquillamente saltare:

| Non Hai Bisogno di | Perché |
|-------------------|--------|
| Padronanza del linguaggio di programmazione | L'IA scrive il codice; tu lo revisioni |
| Esperienza nei framework | L'IA conosce React, Rails, Django meglio della maggior parte degli umani |
| Conoscenza degli algoritmi | L'IA implementa gli algoritmi; tu descrivi l'obiettivo |
| Competenze DevOps | L'IA scrive config CI, Dockerfile, script di distribuzione |
| Pattern di design memorizzati | L'IA applica il pattern giusto quando descrivi il comportamento |
| Anni di esperienza | Prospettiva fresca + IA > esperienza senza IA[^8] |

Questo non significa che queste competenze siano prive di valore — ti rendono più veloce e più efficace. Ma non sono più **prerequisiti**. Puoi impararle gradualmente, sul campo, con l'IA che ti insegna mentre procedi.

## L'Effetto Composto

Queste cinque competenze — Git, TDD, terminale, inglese e gusto — non si sommano semplicemente. Si **amplificano**.[^9]

- La sicurezza di Git ti permette di sperimentare liberamente, il che sviluppa il gusto più velocemente
- Il TDD ti dà fiducia nell'output dell'IA, così puoi muoverti più velocemente
- La fluidità nel terminale ti permette di eseguire test e comandi Git senza attrito
- La comprensione dell'inglese ti permette di leggere messaggi di errore e documentazione
- Il gusto rende i tuoi prompt più precisi, il che produce codice migliore
- Il codice migliore ti dà esempi migliori da cui imparare

Dopo alcune settimane di sviluppo assistito dall'IA, ti ritroverai a capire cose che non hai mai studiato formalmente. Questo è l'effetto composto all'opera — ed è per questo che queste cinque fondamenta, e solo queste cinque, sono davvero indispensabili.

[^1]: I movimenti "no-code" e "low-code" hanno cercato di rimuovere le barriere alla programmazione per anni. Gli strumenti di codifica AI ottengono questo in modo più efficace perché non limitano quello che puoi costruire — scrivono codice arbitrario in qualsiasi linguaggio, seguendo qualsiasi pattern, basato su descrizioni in linguaggio naturale. Vedere: Jiang, E. et al. (2022). [Discovering the Syntax and Strategies of Natural Language Programming with Generative Language Models](https://dl.acm.org/doi/10.1145/3491102.3501870). *CHI 2022*.

[^2]: Il modello di branching di Git cambia fondamentalmente come le persone affrontano la sperimentazione. La ricerca sui flussi di lavoro degli sviluppatori mostra che i team che usano commit frequenti e piccoli con branch sono significativamente più propensi a tentare modifiche rischiose — perché il costo del fallimento scende quasi a zero. Vedere: Bird, C. et al. (2009). [Does Distributed Development Affect Software Quality?](https://dl.acm.org/doi/10.1145/1555001.1555040). *ICSE 2009*.

[^3]: Il Test-Driven Development è stato formalizzato da Kent Beck nel 2002 ed è diventato da allora una pietra angolare dell'ingegneria software professionale. La disciplina di scrivere i test prima forza gli sviluppatori a chiarire i requisiti prima dell'implementazione — un vantaggio che diventa ancora più potente quando lo "sviluppatore" è un'IA che ha bisogno di istruzioni precise. Vedere: Beck, K. (2002). [Test-Driven Development: By Example](https://www.oreilly.com/library/view/test-driven-development/0321146530/). Addison-Wesley.

[^4]: Gli studi sulla generazione di codice AI trovano costantemente che il codice generato dall'IA supera i test funzionali a tassi inferiori rispetto al codice scritto da umani a meno che non sia guidato da casi di test espliciti. Fornire casi di test nel prompt aumenta la generazione di codice corretto del 20–40%. Vedere: Chen, M. et al. (2021). [Evaluating Large Language Models Trained on Code](https://arxiv.org/abs/2107.03374). *arXiv:2107.03374*; Austin, J. et al. (2021). [Program Synthesis with Large Language Models](https://arxiv.org/abs/2108.07732). *arXiv:2108.07732*.

[^5]: I modelli AI sistematicamente sottoperformano su casi limite e condizioni al confine. Tendono a generare codice "happy path" che gestisce gli input comuni ma fallisce su quelli insoliti. Questa è una limitazione documentata della generazione di codice basata su transformer — i dati di addestramento sono sbilanciati verso i pattern di utilizzo tipici. Vedere: Pearce, H. et al. (2022). [Examining Zero-Shot Vulnerability Repair with Large Language Models](https://arxiv.org/abs/2112.02125). *IEEE S&P 2022*.

[^6]: L'inglese domina la programmazione e la documentazione tecnica con un margine schiacciante. L'analisi dei repository pubblici di GitHub mostra che oltre il 90% dei file README e dei commenti al codice sono in inglese. Allo stesso modo, le 23 milioni di domande di Stack Overflow sono prevalentemente in inglese. Vedere: Casalnuovo, C. et al. (2015). [Developer Onboarding in GitHub](https://dl.acm.org/doi/10.1145/2786805.2786854). *ESEC/FSE 2015*.

[^7]: Il "gusto" nell'ingegneria del software — la capacità di distinguere il buon design dal cattivo — è sempre più riconosciuto come una competenza fondamentale. Fred Brooks ha scritto che "i grandi design vengono da grandi designer", non da grandi processi. Con l'IA che gestisce gli aspetti meccanici della codifica, questo giudizio estetico diventa il contributo umano principale. Vedere: Brooks, F. (2010). [The Design of Design](https://www.oreilly.com/library/view/the-design-of/9780321702081/). Addison-Wesley.

[^8]: Gli studi sulla programmazione assistita dall'IA mostrano che gli sviluppatori con meno esperienza spesso beneficiano di più degli strumenti AI rispetto agli esperti — perché il divario tra "sa descrivere" e "sa implementare" si riduce drasticamente con l'assistenza AI. Vedere: Peng, S. et al. (2023). [The Impact of AI on Developer Productivity](https://arxiv.org/abs/2302.06590). *arXiv:2302.06590*.

[^9]: Il concetto di "apprendimento composto" — dove le competenze fondamentali accelerano l'acquisizione di competenze correlate — è ben consolidato nella ricerca educativa. Nella programmazione in particolare, capire alcune idee fondamentali sblocca l'apprendimento rapido di tutto ciò che è costruito sopra di esse. Vedere: Sorva, J. (2012). [Visual Program Simulation in Introductory Programming Education](https://aaltodoc.aalto.fi/handle/123456789/3534). Aalto University.
