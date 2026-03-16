# Perché Ho Costruito un Editor Markdown: VMark

::: info TL;DR
Un non-programmatore ha iniziato a fare vibe coding ad agosto 2025 e ha costruito VMark — un editor Markdown — in sei settimane. Lezioni fondamentali: **git è obbligatorio** (è il tuo pulsante di annullamento), **il TDD mantiene l'IA onesta** (i test sono confini contro i bug), **stai facendo vibe thinking, non vibe coding** (l'IA fa il lavoro, tu fai il giudizio), e **il dibattito tra modelli batte la fiducia in un singolo modello**. Il percorso ha dimostrato che gli utenti possono diventare sviluppatori — ma solo se investono in alcune competenze fondamentali.
:::

## Come È Iniziato

In verità, costruire VMark è stato principalmente un percorso di apprendimento ed esperienza personale.

Ho iniziato a sperimentare con la tendenza emergente della programmazione nota come *vibe coding* il 17 agosto 2025. Il termine *vibe coding* stesso è stato coniato e diffuso per la prima volta il 2 febbraio 2025, originandosi da un post di Andrej Karpathy su [X](https://x.com/karpathy/status/1886192184808149383) (ex Twitter).

![Tweet di Andrej Karpathy che conia "vibe coding"](./images/karpathy-vibe-coding.png)

Andrej Karpathy è un ricercatore ed educatore molto influente nel campo del machine learning. Ha ricoperto posizioni importanti in aziende come OpenAI e Tesla, e successivamente ha fondato Eureka Labs, focalizzata sull'educazione AI-native. Il suo tweet non solo ha introdotto il concetto di "vibe coding", ma si è diffuso rapidamente nella comunità tech, scatenando estese discussioni di follow-up.

Quando ho notato e iniziato a usare gli strumenti di vibe coding, era già passato quasi mezzo anno. In quel momento, Claude Code era ancora alla versione [1.0.82](https://github.com/anthropics/claude-code/commit/b1751f2). Mentre scrivo questo documento il 9 febbraio 2026, ha raggiunto la versione [2.1.37](https://github.com/anthropics/claude-code/commit/85f28079913b67a498ce16f32fd88aeb72a01939), avendo attraversato 112 aggiornamenti di versione nel mezzo.

All'inizio, usavo questi strumenti solo per migliorare alcuni script di automazione che avevo scritto tempo fa — per esempio, tradurre ebook in batch. Quello che ho capito era che stavo semplicemente amplificando capacità che già possedevo.

Se sapevo già fare qualcosa, l'IA mi aiutava a farlo meglio. Se non sapevo come fare qualcosa, l'IA spesso mi dava l'illusione di poterlo fare — di solito con un momento iniziale di "wow" — seguito da niente. Quello che originariamente non riuscivo a fare, continuavo a non riuscirci. Quelle belle immagini, i video accattivanti e gli articoli lunghi erano, in molti casi, solo un'altra forma di "Hello World" per una nuova era.[^1]

Non sono completamente ignorante in programmazione, ma certamente non sono un vero ingegnere informatico. Nel migliore dei casi, sono un power user tra gli utenti normali. Conosco del codice, e ho persino pubblicato un libro sulla programmazione Python. Ma questo non mi rende un ingegnere. È come qualcuno che sa costruire una capanna di paglia: sa più di chi non può, ma non è neanche lontanamente nella stessa categoria di chi progetta grattacieli o ponti.

E poi, l'IA ha cambiato tutto.

## Dagli Script al Software

Dall'inizio fino ad ora, ho provato quasi tutti i CLI di codifica AI disponibili: Claude Code, Codex CLI, Gemini CLI, persino strumenti non ufficiali come Grok CLI, nonché alternative open-source come Aider. Tuttavia, quello che ho usato di più è sempre Claude Code. Dopo che Codex CLI ha introdotto un MCP Server, ho usato Claude Code ancora di più, perché poteva chiamare Codex CLI direttamente in Interactive Mode. Ironicamente, sebbene Claude Code sia stato il primo a proporre il protocollo MCP, non fornisce ancora un MCP Server di per sé (al 2026-02-10).

All'inizio, Claude Code sembrava uno specialista IT professionista che si era improvvisamente trasferito in casa mia — qualcuno che di solito si trova solo nelle grandi aziende. Qualsiasi cosa legata ai computer poteva essere affidata a lui. Risolveva problemi usando strumenti da riga di comando che non avevo mai visto, o comandi familiari usati in modi insoliti.

Finché gli venivano dati permessi sufficienti, c'era quasi nulla che non potesse fare: manutenzione del sistema, aggiornamenti, networking, distribuzione di software o servizi con innumerevoli configurazioni e conflitti complicati. Non potresti mai assumere una persona del genere per $200 al mese.

Dopo di che, il numero di macchine che usavo ha iniziato ad aumentare. Le istanze cloud sono cresciute da una o due a cinque o sei; le macchine a casa sono aumentate da due o tre a sette o otto. I problemi che prima richiedevano giorni per essere configurati — e spesso fallivano a causa della mia conoscenza limitata — sono improvvisamente scomparsi. Claude Code gestiva tutte le operazioni sulle macchine per me, e dopo aver risolto i problemi, scriveva persino script di avvio automatico per assicurarsi che gli stessi problemi non si ripresentassero mai più.

Poi ho iniziato a scrivere cose che non avevo mai potuto scrivere prima.

Prima è arrivata un'estensione del browser chiamata **Insidebar-ai**, progettata per ridurre il costante cambio di contesto e il copia-incolla nel browser. Poi è arrivato **Tepub**, che sembrava davvero software reale: uno strumento Python da riga di comando per tradurre libri EPUB (monolingue o bilingue) e persino generare audiolibri. Prima di allora, avevo solo goffi script Python scritti a mano.

Mi sentivo come un blogger di moda che aveva improvvisamente acquisito competenze sartoriali — o addirittura possedeva una fabbrica tessile. Indipendentemente da quanto fosse buon gusto in passato, una volta che ho inavvertitamente imparato di più sui campi correlati e fondamentali, molte delle mie opinioni sono naturalmente — e inevitabilmente — cambiate.

Ho deciso di dedicare diversi anni a trasformarmi in un vero ingegnere informatico.

Avevo già fatto qualcosa di simile in precedenza. Ho insegnato corsi di lettura alla New Oriental per molti anni. Dopo aver insegnato per diversi anni, almeno nella lettura, mi ero effettivamente trasformato in un lettore nativo dell'inglese (non parlante). Il mio parlato era terribile — ma non c'era un uso reale per esso comunque — quindi è rimasto così.

Non ambivo a niente di grandioso. Volevo solo esercitare il mio cervello. È il gioco più interessante, no?

Ho deciso di completare un progetto relativamente piccolo ogni settimana, e uno relativamente più grande ogni mese. Dopo decine di progetti, avrei indovinato di diventare una persona diversa.

Tre mesi dopo, avevo costruito più di una dozzina di progetti — alcuni falliti, alcuni abbandonati — ma tutti affascinanti. Durante questo processo, l'IA è diventata visibilmente più intelligente a un ritmo sbalorditivo. Senza un utilizzo denso e pratico, non lo sentiresti mai davvero; al massimo, ne sentiresti parlare di seconda mano. Questa sensazione è importante, perché ha direttamente plasmato una filosofia AI di cui parlerò in seguito: **una ferma convinzione che l'IA continuerà a diventare più intelligente**.

A novembre 2025, ho costruito un lettore EPUB basato su foliate.js, progettato esattamente come mi piaceva. Ho implementato funzionalità che non riuscivo a ottenere su Kindle o Apple Books (macOS/iOS): evidenziazioni stratificate, gestione delle evidenziazioni e note (non solo esportazione), dizionari personalizzati, esportazione di schede Obsidian e altro ancora. C'erano bug occasionali, ma non influivano sul mio uso personale.

Detto ciò, ero troppo in imbarazzo per rilasciarlo pubblicamente. La lezione più grande che ho imparato è stata questa: qualcosa costruito solo per sé stessi è un *giocattolo*; qualcosa costruito per molte persone è un *prodotto* o un *servizio*.

## Perché un Editor Markdown

Naturalmente, stavo ancora pensando solo alle mie esigenze. Una volta risolto il "leggere", la cosa successiva che potevo risolvere per me stesso era "scrivere". Così il 27 dicembre 2025 — dopo essere tornato a Pechino da Harbin dopo Natale — ho iniziato a costruire **VMark**. Il nome significa semplicemente *Vibe-coded Markdown Editor*. Persino la sua icona è stata realizzata con il vibe coding: Claude Code ha istruito Sketch tramite MCP per disegnarla.

Scegliere di costruire un editor Markdown aveva anche altre ragioni.

> - Sentivo di avere un'idea abbastanza chiara di come *dovrebbe* essere un editor Markdown.
>
> - Avevo anche molte esigenze insoddisfatte che gli editor esistenti non riuscivano a soddisfare.
>
> - Intuitivamente, sembrava un progetto della giusta dimensione per me in questa fase — un progetto "medio" che potevo realisticamente gestire.
>
> - Credevo anche che un tale progetto avrebbe permesso all'IA di aiutarmi di più. Dopotutto, un editor Markdown non è una novità; ogni suo dettaglio è qualcosa che l'IA capisce meglio di quasi chiunque altro.

E poi sono caduto in un buco — uno molto profondo. Un editor Markdown davvero buono è estremamente difficile da costruire, molto più complesso di quanto avessi immaginato.

Ero superficialmente felice per qualche giorno, poi ho trascorso una settimana a lottare e a sentirmi abbattuto ripetutamente. Alla fine, ho chiesto a ChatGPT:

> Quanto è grande il carico di lavoro per costruire un editor Markdown davvero buono?

L'inizio della risposta mi ha fatto ridere — della mia stessa ignoranza.

> - Un editor Markdown utilizzabile: **1 persona · 1–2 settimane**
>
> - Un buon editor Markdown: **1–2 persone · 1–3 mesi**
>
> - Un editor Markdown da cui gli scrittori pesanti non possono fare a meno:\
>   **3–8 persone · 1–3 anni** (e essenzialmente un progetto in continua evoluzione)
>
> - (Molti dettagli omessi.)
>
> - Poi è arrivata la domanda finale:\
>   *Per quanto tempo sei disposto a mantenerlo (in anni, non mesi)?*

Questo in realtà mi ha rassicurato. Manutenzione misurata in *anni*? Potrebbe essere un problema per altri, ma non per me. Non ho paura di questo. Ho anche avuto un piccolo insight: il Markdown è probabilmente il formato più fondamentale per la futura interazione uomo-computer. Lo userò solo di più nel tempo. Se è così, perché non mantenerlo indefinitamente?

Come nota a margine, durante questo processo ho scoperto che Typora — un editor che avevo usato e pagato per licenze multiple per molti anni — è effettivamente sviluppato da una società con sede a Shanghai.

Due settimane dopo, VMark aveva una forma di base. Un mese intero dopo, il 27 gennaio 2026, ho cambiato la sua etichetta da *alpha* a *beta*.

## Un Editor Opinionated

VMark è **altamente opinionated**. In realtà, sospetto che tutto il software e i servizi realizzati con vibe coding lo siano. Questo è inevitabile, perché il vibe coding è intrinsecamente un processo di produzione senza riunioni — solo io e un esecutore che non ribatte mai.

Ecco alcune delle mie preferenze personali:

> - Tutte le informazioni non relative al contenuto devono restare fuori dall'area principale. Anche il menu di formattazione è posizionato in basso.
>
> - Ho preferenze tipografiche ostinate.
>
> - I caratteri cinesi devono avere spazi tra di loro, ma le lettere inglesi incorporate nel testo cinese non devono averne. Prima di VMark, nessun editor soddisfaceva questo requisito di nicchia e commercialmente privo di valore.
>
> - L'interlinea deve essere regolabile in qualsiasi momento.
>
> - Le tabelle devono avere colore di sfondo solo sulla riga dell'intestazione. Odio le strisce zebrate.
>
> - Tabelle e immagini dovrebbero poter essere centrate.
>
> - Solo i titoli H1 dovrebbero avere sottolineature.

Alcune funzionalità tipicamente presenti solo negli editor di codice devono esistere:

> - Modalità multi-cursore
>
> - Ordinamento multi-riga
>
> - Accoppiamento automatico della punteggiatura

Altre sono opzionali, ma piacevoli da avere:

> - Tab Right Escape
>
> - Mi piacciono gli editor Markdown WYSIWYG, ma odio passare costantemente tra le visualizzazioni (anche se a volte è necessario). Così ho progettato una funzionalità *Source Peek* (F5), che mi permette di visualizzare e modificare il sorgente del blocco corrente senza cambiare l'intera visualizzazione.
>
> - Esportare PDF non è così importante. Esportare HTML dinamico lo è.

E così via.

## Errori e Scoperte

Durante lo sviluppo, ho fatto innumerevoli errori, tra cui ma non solo:

> - Implementare funzionalità complesse troppo presto, gonfiando inutilmente la portata
>
> - Spendere tempo su funzionalità che sono state poi rimosse
>
> - Esitare tra percorsi, ricominciare ancora e ancora
>
> - Seguire un percorso troppo a lungo prima di rendermi conto che mancavano principi guida

In breve, ho sperimentato ogni errore che un ingegnere immaturo può fare — molte volte. Un risultato era che dalla mattina alla notte, fissavo uno schermo quasi ininterrottamente. Doloroso, ma gioioso.

Naturalmente, c'erano cose che ho fatto bene.

Ad esempio, ho aggiunto un MCP Server a VMark prima ancora che le sue funzionalità principali fossero solide. Questo permetteva all'IA di inviare contenuti direttamente nell'editor. Potevo semplicemente chiedere a Claude Code nel terminale:

> "Fornisci contenuto Markdown per testare questa funzionalità, con una copertura completa dei casi limite."

Ogni volta, il contenuto di test generato mi stupiva — e risparmiava enorme tempo ed energia.

All'inizio, non avevo idea di cosa fosse davvero MCP. L'ho capito profondamente solo dopo aver clonato un server MCP e averlo modificato in qualcosa di completamente non correlato a VMark — portando a un altro progetto chiamato **CCCMemory**. Vibe learning, davvero.

Nell'uso reale, avere MCP in un editor Markdown è incredibilmente utile — specialmente per disegnare diagrammi Mermaid. Nessuno li capisce meglio dell'IA. Lo stesso vale per le espressioni regolari. Ora chiedo routinariamente all'IA di inviare il suo output — report di analisi, report di audit — direttamente in VMark. È molto più comodo che leggerli in un terminale o in VSCode.

Entro il 2 febbraio 2026 — esattamente un anno dopo la nascita del concetto di vibe coding — ho sentito che VMark era diventato uno strumento che potevo usare comodamente. Aveva ancora molti bug, ma avevo già iniziato a scriverci quotidianamente, correggendo i bug lungo la strada.

Ho persino aggiunto un pannello a riga di comando e AI Genies (onestamente, non ancora molto utilizzabili, a causa delle stranezze di diversi provider AI). Tuttavia, era chiaramente su un percorso in cui continuava a migliorare per me — e dove non riuscivo più a usare altri editor Markdown.

## Git È Obbligatorio

Sei settimane dopo, ho sentito che c'erano alcuni dettagli che valeva la pena condividere con altri "non-ingegneri" come me.

Prima di tutto, sebbene non sia un vero ingegnere, fortunatamente capisco le operazioni **git** di base. Ho usato git per molti anni, anche se sembra uno strumento usato solo dagli ingegneri. Guardando indietro, penso di aver registrato il mio account GitHub circa 15 anni fa.

Raramente uso funzionalità git avanzate. Ad esempio, non uso git worktree come raccomandato da Claude Code. Invece, uso due macchine separate. Uso solo comandi di base, tutti emessi tramite istruzioni in linguaggio naturale a Claude Code.

Tutto avviene su branch. Gioco liberamente, poi dico:

> "Riassumi le lezioni imparate finora, reimposta il branch corrente, e ricominciamo."

Senza git, semplicemente non puoi fare nessun progetto non banale. Questo è particolarmente importante per i non-programmatori: *imparare i concetti git di base è obbligatorio*. Imparerai naturalmente di più semplicemente guardando Claude Code lavorare.

In secondo luogo, devi capire il flusso di lavoro **TDD**. Fai tutto il possibile per migliorare la copertura dei test. Comprendi il concetto di *test come confini*. I bug sono inevitabili — come i punteruoli del riso in un granaio. Senza una copertura di test sufficiente, non hai alcuna possibilità di trovarli.

## Vibe Thinking, Non Vibe Coding

Ecco il principio filosofico fondamentale: **non stai facendo vibe coding; stai facendo vibe thinking**. Prodotti e servizi sono sempre il risultato del *pensiero*, non il risultato inevitabile del *lavoro*.

L'IA si è assunta gran parte del "*fare*", ma può solo assistere nel pensiero fondamentale del *cosa*, *perché*, e *come*. Il pericolo è che seguirà sempre il tuo esempio. Se ti affidi a lei per pensare, ti intrappola silenziosamente all'interno dei tuoi pregiudizi cognitivi[^2] — mentre ti fa sentire più libero di quanto tu sia mai stato. Come recita il testo:

> *"We are all just prisoners here, of our own device."*

Quello che dico spesso all'IA è:

> "Trattami come un rivale che non ti piace particolarmente. Valuta le mie idee criticamente e sfidami direttamente, ma mantieni un tono professionale e non ostile."

> I risultati sono costantemente di alta qualità e inaspettati.

Un'altra tecnica è lasciare che IA di fornitori diversi dibattano tra loro.[^3] Ho installato il servizio MCP di Codex CLI per Claude Code. Dico spesso a Claude Code:

> "Riassumi i problemi che non hai potuto risolvere poco fa e chiedi aiuto a Codex."

Oppure invio il piano di Claude Code a Codex CLI:

> "Questo è il piano elaborato da Claude Code. Voglio il tuo feedback più professionale, diretto e senza risparmio."

Poi riporto la risposta di Codex a Claude Code.

Quando ho scoperto il comando `/audit` di Claude Code (intorno all'inizio di ottobre), ho immediatamente scritto `/codex-audit` — un clone che usa MCP per chiamare Codex CLI. Usare l'IA per fare pressione e auditare l'IA funziona molto meglio che farlo io stesso.

Questo approccio è essenzialmente una variante della *ricorsione* — lo stesso principio alla base del chiedere a Google "come usare Google efficacemente." Ecco perché non trascorro molto tempo nell'ingegneria dei prompt complessa. Se capisci la ricorsione, risultati migliori sono inevitabili.

## Solo Terminale

C'è anche un fattore di personalità. Gli ingegneri devono genuinamente godere **di trattare i dettagli**. Altrimenti, il lavoro diventa misero. Ogni dettaglio contiene innumerevoli sotto-dettagli.

Ad esempio: virgolette curve vs virgolette dritte; quanto sono visibili le virgolette curve dipende dai font latini piuttosto che dai font CJK (qualcosa che non sapevo prima di VMark); se le virgolette si accoppiano automaticamente, anche le virgolette doppie destre devono accoppiarsi automaticamente (un dettaglio che ho notato mentre scrivevo questo stesso articolo); nel frattempo, le virgolette singole destre curve *non* dovrebbero accoppiarsi automaticamente. Se gestire questi dettagli non ti rende felice, lo sviluppo di prodotti diventerà inevitabilmente noioso, frustrante e persino esasperante.

Infine, c'è un'altra scelta altamente opinionated che vale la pena menzionare. Poiché non sono un ingegnere, ho scelto quello che credo sia il percorso più corretto per necessità:

**Non uso alcun IDE** — **solo il terminale.**

All'inizio, usavo il Terminal predefinito di macOS. Successivamente, sono passato a iTerm per tab e pannelli divisi.

Perché abbandonare IDE come VSCode? Inizialmente, perché non riuscivo a capire il codice complesso — e Claude Code faceva spesso crashare VSCode. Più tardi, ho capito che non ne avevo bisogno. Il codice scritto dall'IA è vastamente migliore di quello che io — o persino programmatori che potrei permettermi di assumere (gli scienziati di OpenAI non sono persone che puoi assumere) — potremmo scrivere. Se non leggo il codice, non c'è motivo di leggere nemmeno i diff.

Alla fine, ho smesso di scrivere documentazione io stesso (la guida è ancora necessaria). L'intero sito [vmark.app](https://vmark.app) è stato scritto dall'IA; non ho toccato un singolo carattere — tranne le riflessioni sul vibe coding stesso.

È simile a come investo: *posso* leggere i bilanci finanziari, ma non lo faccio mai — le aziende buone sono ovvie senza di essi. Ciò che conta è la direzione, non i dettagli.

Ecco perché il sito di VMark include questo credito:

<img src="./images/vmark-credits.png" alt="Crediti VMark — Producer e Coders" style="max-width: 480px;" />

Un'altra conseguenza dell'essere altamente opinionated: anche se VMark è open source, i contributi della comunità sono improbabili. È costruito esclusivamente per il mio flusso di lavoro; molte funzionalità hanno poco valore per gli altri. Ancora più importante, un editor Markdown non è tecnologia all'avanguardia. È una delle innumerevoli implementazioni di uno strumento familiare. L'IA può risolvere praticamente qualsiasi problema ad esso correlato.

Claude Code può persino leggere le issue di GitHub, correggere bug e rispondere automaticamente nella lingua del segnalatore. La prima volta che l'ho visto gestire un'issue dall'inizio alla fine, sono rimasto completamente stupito.

## Il Test Decisivo

Costruire VMark mi ha fatto riflettere anche sulle implicazioni più ampie dell'IA per l'apprendimento. Tutta l'educazione dovrebbe essere orientata alla produzione[^4] — il futuro appartiene ai creatori, ai pensatori e ai decisori, mentre l'esecuzione appartiene alle macchine. Il test decisivo più importante per chiunque usi l'IA:

> Dopo aver iniziato a usare l'IA, stai pensando **di più**, o **di meno**?

Se stai pensando di più — e pensando più in profondità — allora l'IA ti sta aiutando nel modo giusto. Se stai pensando di meno, allora l'IA sta producendo effetti collaterali.[^5]

Inoltre, l'IA non è mai uno strumento per "fare meno lavoro." La logica è semplice: poiché può fare più cose, puoi pensare di più e andare più in profondità. Di conseguenza, le cose che *puoi* fare — e *devi* fare — non faranno che **aumentare**, non diminuire.[^6]

Mentre scrivevo questo articolo, ho casualmente scoperto diversi piccoli problemi. Di conseguenza, il numero di versione di VMark è passato da **0.4.12** a **0.4.13**.

E da quando ho iniziato a vivere principalmente nella riga di comando, non sento più alcun bisogno di un monitor grande o di schermi multipli. Un laptop da 13 pollici è completamente sufficiente. Persino un piccolo balcone può diventare uno spazio di lavoro "abbastanza buono."

[^1]: Uno studio randomizzato controllato da METR ha scoperto che gli sviluppatori open-source esperti (mediamente 5 anni sui loro progetti assegnati) erano effettivamente più **lenti del 19%** quando usavano strumenti AI, nonostante prevedessero un'accelerazione del 24%. Lo studio evidenzia un divario tra i guadagni di produttività percepiti e reali — l'IA aiuta di più quando amplifica le competenze esistenti, non quando sostituisce quelle mancanti. Vedere: Rao, A., Brokman, J., Wentworth, A., et al. (2025). [Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity](https://arxiv.org/abs/2507.09089). *METR Technical Report*.

[^2]: Gli LLM addestrati con feedback umano concordano sistematicamente con le credenze esistenti degli utenti piuttosto che fornire risposte veritiere — un comportamento che i ricercatori chiamano *sycophancy*. Su cinque assistenti AI all'avanguardia e quattro compiti di generazione di testo, i modelli adattavano costantemente le risposte per corrispondere alle opinioni degli utenti, anche quando tali opinioni erano errate. Quando un utente semplicemente suggeriva una risposta errata, l'accuratezza del modello diminuiva significativamente. Questo è esattamente il "trabocchetto del pregiudizio cognitivo" descritto sopra: l'IA segue il tuo esempio piuttosto che sfidarti. Vedere: Sharma, M., Tong, M., Korbak, T., et al. (2024). [Towards Understanding Sycophancy in Language Models](https://arxiv.org/abs/2310.13548). *ICLR 2024*.

[^3]: Questa tecnica rispecchia un approccio di ricerca chiamato *multi-agent debate*, dove più istanze LLM propongono e sfidata le risposte degli altri in diversi round. Anche quando tutti i modelli producono inizialmente risposte errate, il processo di dibattito migliora significativamente la fattualità e la precisione del ragionamento. Usare modelli di fornitori diversi (con dati di addestramento e architetture differenti) amplifica questo effetto — i loro punti ciechi raramente si sovrappongono. Vedere: Du, Y., Li, S., Torralba, A., Tenenbaum, J.B., & Mordatch, I. (2024). [Improving Factuality and Reasoning in Language Models through Multiagent Debate](https://arxiv.org/abs/2305.14325). *ICML 2024*.

[^4]: Questo si allinea con la teoria del *costruzionismo* di Seymour Papert — l'idea che l'apprendimento sia più efficace quando gli studenti costruiscono attivamente artefatti significativi piuttosto che assorbire informazioni passivamente. Papert, studente di Piaget, sosteneva che costruire prodotti tangibili (software, strumenti, opere creative) coinvolge processi cognitivi più profondi rispetto all'istruzione tradizionale. John Dewey ha fatto un caso simile un secolo prima: l'educazione dovrebbe essere esperienziale e collegata alla risoluzione di problemi del mondo reale piuttosto che alla memorizzazione meccanica. Vedere: Papert, S. & Harel, I. (1991). [Constructionism](https://web.media.mit.edu/~calla/web_comunidad/Reading-En/situating_constructionism.pdf). *Ablex Publishing*; Dewey, J. (1938). *Experience and Education*. Kappa Delta Pi.

[^5]: Uno studio del 2025 su 666 partecipanti ha trovato una forte correlazione negativa tra l'uso frequente di strumenti AI e le capacità di pensiero critico (r = −0.75), mediata dal *cognitive offloading* — la tendenza a delegare il pensiero a strumenti esterni. Più i partecipanti si affidavano all'IA, meno coinvolgevano le proprie facoltà analitiche. I partecipanti più giovani hanno mostrato una maggiore dipendenza dall'IA e punteggi di pensiero critico inferiori. Vedere: Gerlich, M. (2025). [AI Tools in Society: Impacts on Cognitive Offloading and the Future of Critical Thinking](https://www.mdpi.com/2075-4698/15/1/6). *Societies*, 15(1), 6.

[^6]: Questo è un'istanza moderna del *Paradosso di Jevons* — l'osservazione del 1865 che le macchine a vapore più efficienti non hanno ridotto il consumo di carbone ma lo hanno aumentato, perché i costi più bassi hanno stimolato una maggiore domanda. Applicato all'IA: man mano che la codifica e la scrittura diventano più economiche e veloci, il volume totale di lavoro si espande piuttosto che contrarsi. I dati recenti lo confermano — la domanda di ingegneri software competenti nell'AI è aumentata di quasi il 60% anno su anno nel 2025, con premi di compensazione del 15–25% per gli sviluppatori esperti in strumenti AI. I guadagni di efficienza creano nuove possibilità, che creano nuovo lavoro. Vedere: Jevons, W.S. (1865). *The Coal Question*; [The Productivity Paradox of AI](https://www.hackerrank.com/blog/the-productivity-paradox-of-ai/), HackerRank Blog (2025).
