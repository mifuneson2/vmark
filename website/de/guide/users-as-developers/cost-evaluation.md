# Was würde VMark kosten?

::: info Kurzfassung
VMark umfasst ca. 109.000 Zeilen Produktionscode und 206.000 Zeilen Testcode in TypeScript, Rust, CSS und Vue. Ein menschliches Team bräuchte **4.239 Entwicklertage** (~17 Personenjahre), um es von Grund auf zu bauen. Zu US-Marktpreisen entspricht das **3,4–4,2 Mio. USD**. Es wurde in **85 Kalendertagen** von einer Person mit KI-Unterstützung gebaut, zu Kosten von rund **2.000 USD** — ein ~50-facher Produktivitätsmultiplikator und ~99,9 % Kostenreduktion.
:::

## Warum diese Seite existiert

Eine Frage taucht immer wieder auf: *„Wie viel Aufwand hat VMark tatsächlich gekostet?"*

Dies ist keine Marketingseite. Es handelt sich um eine transparente, datenbasierte Analyse mit echten Code-Metriken — nicht um Bauchgefühl. Jede Zahl hier stammt aus `tokei` (Zeilenzählung), `git log` (Verlauf) und `vitest` (Testanzahl). Sie können diese Zahlen selbst nachvollziehen, indem Sie das Repository klonen.

## Rohdaten

| Metrik | Wert |
|--------|------|
| Produktionscode (Frontend TS/TSX) | 85.306 LOC |
| Produktionscode (Rust-Backend) | 10.328 LOC |
| Produktionscode (MCP-Server) | 4.627 LOC |
| Produktions-CSS | 8.779 LOC |
| i18n-Lokalisierungsdaten | 10.130 LOC |
| Website (Vue + TS + Docs) | 4.421 LOC + 75.930 Zeilen Docs |
| **Testcode** | **206.077 LOC** (656 Dateien) |
| Testanzahl | 17.255 Tests |
| Dokumentation | 75.930 Zeilen (320 Seiten, 10 Sprachen) |
| Commits | 1.993 über 84 aktive Tage |
| Kalenderzeit | 85 Tage (27. Dez. 2025 — 21. März 2026) |
| Beitragende | 2 (1 Mensch + KI) |
| Churn-Verhältnis | 3,7x (1,23 Mio. Einfügungen / 330.000 finale Zeilen) |
| Test-zu-Produktions-Verhältnis | **2,06:1** |

### Was diese Zahlen bedeuten

- **Test-zu-Produktions-Verhältnis von 2,06:1** ist außergewöhnlich. Die meisten Open-Source-Projekte liegen bei etwa 0,3:1. VMark hat mehr Testcode als Produktionscode — um den Faktor zwei.
- **Churn-Verhältnis von 3,7x** bedeutet, dass für jede Zeile in der finalen Codebasis insgesamt 3,7 Zeilen geschrieben wurden (einschließlich Umschreibungen, Refactorings und gelöschtem Code). Das deutet auf erhebliche Iteration hin — nicht „einmal schreiben und ausliefern".
- **1.993 Commits in 84 aktiven Tagen** ergibt im Durchschnitt ~24 Commits pro Tag. KI-gestützte Entwicklung produziert viele kleine, fokussierte Commits.

## Komplexitätsaufschlüsselung

Nicht jeder Code ist gleich. Eine Zeile Konfigurationsparsing ist nicht dasselbe wie eine Zeile ProseMirror-Plugin-Code. Wir klassifizieren die Codebasis in vier Komplexitätsstufen:

| Stufe | Was sie umfasst | LOC | Rate (LOC/Tag) |
|-------|-----------------|-----|----------------|
| **Routine** (1,0x) | i18n-JSON, CSS-Tokens, Seitenlayouts, Einstellungs-UI | 23.000 | 150 |
| **Standard** (1,5x) | Stores, Hooks, Komponenten, MCP-Bridge, Export, Rust-Befehle, Website | 52.000 | 100 |
| **Komplex** (2,5x) | ProseMirror/Tiptap-Plugins (Multi-Cursor, Fokusmodus, Code-Vorschau, Tabellen-UI, IME-Schutz), CodeMirror-Integration, Rust-KI-Provider, MCP-Server | 30.000 | 50 |
| **Forschung** (4,0x) | CJK-Formatierungs-Engine, Kompositions-Schutzsystem, Auto-Pair mit IME-Erkennung | 4.000 | 25 |

Die „LOC/Tag"-Raten gehen von einem Senior-Entwickler aus, der getesteten, geprüften Code schreibt — keine rohe, ungeprüfte Ausgabe.

### Warum Editor-Plugins teuer sind

Der mit Abstand teuerste Teil von VMark ist die **ProseMirror/Tiptap-Plugin-Schicht** — 34.859 Zeilen Code, die Textauswahlen, Dokument-Transaktionen, Node-Views und IME-Komposition verwalten. Dies gilt weithin als die schwierigste Kategorie der Webentwicklung:

- Man arbeitet mit einem Dokumentmodell, nicht mit einem Komponentenbaum
- Jede Bearbeitung ist eine Transaktion, die die Dokumentintegrität wahren muss
- IME-Komposition (für CJK-Eingabe) fügt eine vollständige parallele Zustandsmaschine hinzu
- Multi-Cursor erfordert die gleichzeitige Verfolgung von N unabhängigen Auswahlen
- Rückgängig/Wiederherstellen muss bei all dem korrekt funktionieren

Deshalb wird die Plugin-Schicht als „Komplex" (2,5x-Multiplikator) und der CJK/IME-Code als „Forschung" (4,0x) eingestuft.

## Aufwandsschätzung

| Komponente | LOC | Entwicklertage |
|------------|-----|----------------|
| Stufe 1 — Produktion (Routine) | 23.000 | 153 |
| Stufe 2 — Produktion (Standard) | 52.000 | 520 |
| Stufe 3 — Produktion (Komplex) | 30.000 | 600 |
| Stufe 4 — Produktion (Forschung) | 4.000 | 160 |
| Testcode | 206.077 | 1.374 |
| Dokumentation (10 Sprachen) | 75.930 | 380 |
| **Zwischensumme** | | **3.187** |
| Overhead (Design 5 % + CI 3 % + Review 10 %) | | 574 |
| Churn-Zuschlag (3,7x → +15 %) | | 478 |
| **Gesamt** | | **4.239 Entwicklertage** |

Das entspricht ungefähr **17 Personenjahren** Vollzeit-Senior-Engineering.

::: warning Hinweis zum Testaufwand
Die Testsuite (206.000 LOC, 17.255 Tests) macht **1.374 Entwicklertage** aus — mehr als ein Drittel des Gesamtaufwands. Das sind die Kosten der Test-first-Disziplin dieses Projekts. Ohne sie wäre das Projekt ~40 % günstiger zu bauen, aber deutlich schwerer zu warten.
:::

## Kostenschätzung

Basierend auf US-Marktpreisen (Vollkosten — Gehalt + Nebenleistungen + Gemeinkosten):

| Szenario | Team | Dauer | Kosten |
|----------|------|-------|--------|
| Solo-Senior ($800/Tag) | 1 Person | 17,7 Jahre | **3,39 Mio. USD** |
| Kleines Team ($900/Tag Durchschn.) | 3 Personen | 2,3 Jahre | **3,82 Mio. USD** |
| Volles Team ($1.000/Tag Durchschn.) | 5 Personen | 10,6 Monate | **4,24 Mio. USD** |

Teams skalieren nicht linear. Ein 5-Personen-Team ist ~4-mal so produktiv wie eine Einzelperson (nicht 5-mal), weil der Kommunikationsaufwand wächst — das ist Brooks' Gesetz in Aktion.

## Die KI-Realität

| Metrik | Wert |
|--------|------|
| Tatsächliche Kalenderzeit | **85 Tage** (12 Wochen) |
| Menschliches Äquivalent | 4.239 Entwicklertage (~17 Personenjahre) |
| **Produktivitätsmultiplikator** | **~50x** |
| Geschätzte tatsächliche Kosten | ~2.000 USD (Claude Max-Abonnement) |
| Menschliches Äquivalent (Solo) | 3,39 Mio. USD |
| **Kostenreduktion** | **~99,9 %** |

### Was der 50x-Multiplikator bedeutet

Er bedeutet **nicht**, dass „KI 50-mal klüger ist als ein Mensch." Er bedeutet:

1. **KI wechselt nicht den Kontext.** Sie kann die gesamte Codebasis im Gedächtnis halten und gleichzeitig Änderungen in 10 Dateien vornehmen.
2. **KI schreibt Tests mit Produktionsgeschwindigkeit.** Für einen Menschen sind 17.255 Tests eine nervenaufreibende Plackerei. Für KI ist es einfach mehr Code.
3. **KI erledigt Boilerplate sofort.** Die 10-Sprachen-Übersetzungsschicht (10.130 LOC JSON + 320 Seiten Docs) würde ein menschliches Team Wochen kosten. KI erledigt es in Minuten.
4. **KI wird nicht gelangweilt.** Die 656 Testdateien, die Grenzfälle, IME-Komposition und CJK-Formatierung abdecken, sind genau die Art von Arbeit, die Menschen überspringen.

Die Rolle des Menschen war das Urteilsvermögen — *was* gebaut werden soll, *wann* aufgehört werden soll, *welcher* Ansatz gewählt werden soll. Die Rolle der KI war die Arbeit — Schreiben, Testen, Debuggen, Übersetzen.

## Marktvergleich

| Dimension | VMark | Typora | Zettlr | Mark Text |
|-----------|-------|--------|--------|-----------|
| Kernfunktion | Markdown WYSIWYG + Source | Markdown WYSIWYG | Akademisches Markdown | Markdown WYSIWYG |
| LOC (geschätzt) | ~109.000 Prod. | ~200.000 (Closed Source) | ~80.000 | ~120.000 |
| Beitragende | 2 (1 Mensch + KI) | 1–2 (Closed) | ~50 | ~100 |
| Alter | **3 Monate** | 8+ Jahre | 6+ Jahre | 6+ Jahre |
| Preis | Kostenlos (Beta) | 15 USD Lizenz | Kostenlos / OSS | Kostenlos / OSS |
| Alleinstellungsmerkmal | Tauri-nativ, MCP AI, CJK-nativ, Multi-Cursor | Politur, PDF-Export | Zettelkasten, Zitationen | Electron, ausgereift |

### Was dieser Vergleich zeigt

VMark erreichte eine vergleichbare Codebasegröße und Funktionsumfang in **85 Tagen**, wofür andere Projekte **6–8 Jahre** mit Teams von 50–100 Beitragenden brauchten. Die Testdisziplin (17.000 Tests, 2:1-Verhältnis) übertrifft jeden Open-Source-Markdown-Editor in diesem Vergleich.

Das liegt nicht daran, dass VMark „besser" ist — es ist jünger und weniger praxiserprobt. Aber es zeigt, was KI-gestützte Entwicklung möglich macht: Eine einzelne Person kann Ergebnisse produzieren, für die früher ein finanziertes Team nötig war.

## Was VMark teuer macht

Drei Faktoren treiben die Kosten:

1. **Editor-Plugin-Komplexität** — 34.859 LOC ProseMirror-Plugins, die Auswahlen, Transaktionen, Node-Views und IME-Komposition berühren. Das ist Stufe-3/4-Code, den ein Senior-Editor-Framework-Spezialist mit ~50 LOC/Tag schreiben würde.

2. **Extreme Testdisziplin** — Ein Test-zu-Produktions-Verhältnis von 2,06:1 bedeutet, dass der Testcode allein (206.000 LOC) mehr Aufwand erfordert als der Produktionscode. Das ist eine bewusste Investition — sie macht KI-gestützte Entwicklung nachhaltig.

3. **Vollständige i18n in 10 Sprachen** — 320 Dokumentationsseiten, 80 Lokalisierungs-JSON-Dateien und eine komplett lokalisierte Website. Das ist ein operativer Umfang, der normalerweise bei finanzierten kommerziellen Produkten zu finden ist, nicht bei Solo-Projekten.

## Diese Zahlen nachvollziehen

Alle Metriken sind aus dem öffentlichen Repository reproduzierbar:

```bash
# Klonen und installieren
git clone https://github.com/xiaolai/vmark.git
cd vmark && pnpm install

# LOC-Metriken (erfordert tokei: brew install tokei)
tokei --exclude node_modules --exclude dist .

# Git-Verlauf
git log --oneline | wc -l
git log --format='%ai' | awk '{print $1}' | sort -u | wc -l

# Testanzahl
pnpm vitest run src/ 2>&1 | tail -5
```

::: tip Methodik
Die in dieser Analyse verwendeten Produktivitäts-Baselines (LOC/Tag-Raten) sind branchenübliche Schätzungen für Senior-Entwickler, die getesteten, geprüften Code schreiben. Sie stammen aus der Literatur zur Softwareschätzung (McConnell, Capers Jones) und sind auf produktionsreife Ausgabe kalibriert — nicht auf Prototypen oder Proof-of-Concept-Code.
:::
