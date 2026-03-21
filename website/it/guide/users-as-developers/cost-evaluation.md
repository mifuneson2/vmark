# Quanto costerebbe costruire VMark?

::: info In breve
VMark conta circa 109.000 righe di codice di produzione e 206.000 righe di codice di test in TypeScript, Rust, CSS e Vue. Un team umano avrebbe bisogno di **4.239 giorni-sviluppatore** (~17 anni-persona) per costruirlo da zero. Ai prezzi di mercato statunitensi, il costo sarebbe di **3,4–4,2 milioni di dollari**. È stato costruito in **85 giorni di calendario** da una sola persona con assistenza IA, a un costo di circa **2.000 dollari** — un moltiplicatore di produttività di ~50x e una riduzione dei costi del ~99,9%.
:::

## Perché esiste questa pagina

Una domanda ricorre continuamente: *"Quanto impegno ha richiesto realmente VMark?"*

Questa non è una pagina di marketing. È un'analisi trasparente e basata sui dati, costruita su metriche reali del codice — non su impressioni. Ogni numero qui proviene da `tokei` (conteggio righe), `git log` (cronologia) e `vitest` (conteggio test). Potete riprodurre questi numeri clonando il repository.

## Metriche grezze

| Metrica | Valore |
|---------|--------|
| Codice di produzione (frontend TS/TSX) | 85.306 LOC |
| Codice di produzione (backend Rust) | 10.328 LOC |
| Codice di produzione (server MCP) | 4.627 LOC |
| CSS di produzione | 8.779 LOC |
| Dati i18n delle localizzazioni | 10.130 LOC |
| Sito web (Vue + TS + documentazione) | 4.421 LOC + 75.930 righe di documentazione |
| **Codice di test** | **206.077 LOC** (656 file) |
| Numero di test | 17.255 test |
| Documentazione | 75.930 righe (320 pagine, 10 lingue) |
| Commit | 1.993 in 84 giorni attivi |
| Tempo di calendario | 85 giorni (27 dic 2025 — 21 mar 2026) |
| Contributori | 2 (1 umano + IA) |
| Rapporto di riscrittura | 3,7x (1,23M inserimenti / 330K righe finali) |
| Rapporto test/produzione | **2,06:1** |

### Cosa significano questi numeri

- **Rapporto test/produzione di 2,06:1** — è eccezionale. La maggior parte dei progetti open source si aggira intorno a 0,3:1. VMark ha più codice di test che codice di produzione — il doppio.
- **Rapporto di riscrittura di 3,7x** — significa che per ogni riga nel codebase finale, ne sono state scritte 3,7 in totale (incluse riscritture, refactoring e codice eliminato). Ciò indica un'iterazione significativa — non "scrivi una volta e pubblica".
- **1.993 commit in 84 giorni attivi** — una media di ~24 commit al giorno. Lo sviluppo assistito dall'IA produce molti commit piccoli e focalizzati.

## Analisi della complessità

Non tutto il codice è uguale. Una riga di parsing di configurazione non è la stessa cosa di una riga di codice per un plugin ProseMirror. Il codebase è classificato in quattro livelli di complessità:

| Livello | Cosa include | LOC | Velocità (LOC/giorno) |
|---------|--------------|-----|-----------------------|
| **Routine** (1,0x) | JSON i18n, token CSS, layout di pagina, UI delle impostazioni | 23.000 | 150 |
| **Standard** (1,5x) | Store, hook, componenti, bridge MCP, esportazione, comandi Rust, sito web | 52.000 | 100 |
| **Complesso** (2,5x) | Plugin ProseMirror/Tiptap (multicursore, modalità focus, anteprima codice, UI tabelle, guardia IME), integrazione CodeMirror, provider IA Rust, server MCP | 30.000 | 50 |
| **Ricerca** (4,0x) | Motore di formattazione CJK, sistema di guardia della composizione, auto-pair con riconoscimento IME | 4.000 | 25 |

Le velocità "LOC/giorno" presuppongono uno sviluppatore senior che scrive codice testato e revisionato — non output grezzo senza revisione.

### Perché i plugin dell'editor sono costosi

La parte singolarmente più costosa di VMark è il **livello di plugin ProseMirror/Tiptap** — 34.859 righe di codice che gestiscono selezioni di testo, transazioni sul documento, node view e composizione IME. È ampiamente considerata la categoria più difficile dello sviluppo web:

- Si lavora con un modello di documento, non con un albero di componenti
- Ogni modifica è una transazione che deve preservare l'integrità del documento
- La composizione IME (per l'input CJK) aggiunge un'intera macchina a stati parallela
- Il multicursore richiede di tracciare N selezioni indipendenti simultaneamente
- L'annullamento/ripristino deve funzionare correttamente attraverso tutti i punti precedenti

Ecco perché il livello plugin è classificato come "Complesso" (moltiplicatore 2,5x) e il codice CJK/IME come "Ricerca" (4,0x).

## Stima dell'impegno

| Componente | LOC | Giorni-sviluppatore |
|------------|-----|---------------------|
| Livello 1 produzione (routine) | 23.000 | 153 |
| Livello 2 produzione (standard) | 52.000 | 520 |
| Livello 3 produzione (complesso) | 30.000 | 600 |
| Livello 4 produzione (ricerca) | 4.000 | 160 |
| Codice di test | 206.077 | 1.374 |
| Documentazione (10 lingue) | 75.930 | 380 |
| **Subtotale** | | **3.187** |
| Overhead (design 5% + CI 3% + revisione 10%) | | 574 |
| Costo di riscrittura (3,7x → +15%) | | 478 |
| **Totale** | | **4.239 giorni-sviluppatore** |

Equivale a circa **17 anni-persona** di lavoro a tempo pieno di ingegneria senior.

::: warning Nota sull'impegno per i test
La suite di test (206K LOC, 17.255 test) rappresenta **1.374 giorni-sviluppatore** — più di un terzo dell'impegno totale. Questo è il costo della disciplina test-first del progetto. Senza di essa, il progetto costerebbe circa il 40% in meno da costruire, ma sarebbe significativamente più difficile da mantenere.
:::

## Stima dei costi

Utilizzando tariffe di mercato statunitensi (costo pieno — stipendio + benefit + overhead):

| Scenario | Team | Durata | Costo |
|----------|------|--------|-------|
| Singolo senior ($800/giorno) | 1 persona | 17,7 anni | **$3,39M** |
| Team ridotto ($900/giorno in media) | 3 persone | 2,3 anni | **$3,82M** |
| Team completo ($1.000/giorno in media) | 5 persone | 10,6 mesi | **$4,24M** |

I team non scalano linearmente. Un team di 5 persone è circa 4 volte più produttivo di una sola persona (non 5 volte) a causa dell'overhead di comunicazione — è la legge di Brooks in azione.

## La realtà dell'IA

| Metrica | Valore |
|---------|--------|
| Tempo effettivo di calendario | **85 giorni** (12 settimane) |
| Equivalente umano | 4.239 giorni-sviluppatore (~17 anni-persona) |
| **Moltiplicatore di produttività** | **~50x** |
| Costo effettivo stimato | ~$2.000 (abbonamento Claude Max) |
| Costo equivalente umano (singolo) | $3,39M |
| **Riduzione dei costi** | **~99,9%** |

### Cosa significa il moltiplicatore 50x

**Non** significa "l'IA è 50 volte più intelligente di un umano". Significa:

1. **L'IA non cambia contesto.** Può tenere in memoria l'intero codebase e apportare modifiche a 10 file contemporaneamente.
2. **L'IA scrive test alla velocità della produzione.** Per un umano, scrivere 17.255 test è un lavoro estenuante. Per l'IA, è semplicemente altro codice.
3. **L'IA gestisce il boilerplate istantaneamente.** Il livello di traduzione a 10 lingue (10.130 LOC di JSON + 320 pagine di documentazione) richiederebbe settimane a un team umano. L'IA lo fa in pochi minuti.
4. **L'IA non si annoia.** I 656 file di test che coprono casi limite, composizione IME e formattazione CJK sono esattamente il tipo di lavoro che gli umani saltano.

Il ruolo dell'umano era il giudizio — *cosa* costruire, *quando* fermarsi, *quale* approccio adottare. Il ruolo dell'IA era il lavoro — scrivere, testare, correggere, tradurre.

## Confronto con il mercato

| Dimensione | VMark | Typora | Zettlr | Mark Text |
|------------|-------|--------|--------|-----------|
| Funzione principale | Markdown WYSIWYG + Sorgente | Markdown WYSIWYG | Markdown accademico | Markdown WYSIWYG |
| LOC (stima) | ~109K prod | ~200K (codice chiuso) | ~80K | ~120K |
| Contributori | 2 (1 umano + IA) | 1–2 (chiuso) | ~50 | ~100 |
| Età | **3 mesi** | 8+ anni | 6+ anni | 6+ anni |
| Prezzo | Gratuito (beta) | $15 licenza | Gratuito / OSS | Gratuito / OSS |
| Differenziatore chiave | Tauri nativo, MCP AI, CJK nativo, multicursore | Rifinitura, export PDF | Zettelkasten, citazioni | Electron, maturo |

### Cosa mostra questo confronto

VMark ha raggiunto una dimensione del codebase e un set di funzionalità paragonabili in **85 giorni** — risultati che altri progetti hanno impiegato **6–8 anni** a ottenere con team di 50–100 contributori. La disciplina di test (17K test, rapporto 2:1) supera ogni editor markdown open source presente in questo confronto.

Questo non significa che VMark sia "migliore" — è più giovane e meno collaudato. Ma dimostra cosa rende possibile lo sviluppo assistito dall'IA: una singola persona può produrre un output che prima richiedeva un team finanziato.

## Cosa rende costoso costruire VMark

Tre fattori determinano il costo:

1. **Complessità dei plugin dell'editor** — 34.859 LOC di plugin ProseMirror che toccano selezione, transazioni, node view e composizione IME. Si tratta di codice di Livello 3/4 che uno specialista senior di framework editor scriverebbe a ~50 LOC/giorno.

2. **Disciplina di test estrema** — Un rapporto test/produzione di 2,06:1 significa che il solo codice di test (206K LOC) richiede più impegno del codice di produzione. È un investimento deliberato — è ciò che rende sostenibile lo sviluppo assistito dall'IA.

3. **i18n completa a 10 lingue** — 320 pagine di documentazione, 80 file JSON di localizzazione e un sito web completamente tradotto. Si tratta di una scala operativa normalmente vista in prodotti commerciali finanziati, non in progetti individuali.

## Riprodurre questi numeri

Tutte le metriche sono riproducibili dal repository pubblico:

```bash
# Clonare e installare
git clone https://github.com/xiaolai/vmark.git
cd vmark && pnpm install

# Metriche LOC (richiede tokei: brew install tokei)
tokei --exclude node_modules --exclude dist .

# Cronologia Git
git log --oneline | wc -l
git log --format='%ai' | awk '{print $1}' | sort -u | wc -l

# Conteggio test
pnpm vitest run src/ 2>&1 | tail -5
```

::: tip Metodologia
Le basi di produttività (velocità LOC/giorno) utilizzate in questa analisi sono stime standard del settore per sviluppatori senior che scrivono codice testato e revisionato. Provengono dalla letteratura sulla stima del software (McConnell, Capers Jones) e sono calibrate per output di qualità produttiva — non per prototipi o codice proof-of-concept.
:::
