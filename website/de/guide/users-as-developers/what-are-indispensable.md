# Fünf grundlegende menschliche Fähigkeiten, die KI potenzieren

Sie brauchen keinen Informatikabschluss, um mit KI-Coding-Tools Software zu bauen. Aber Sie brauchen einen kleinen Satz von Fähigkeiten, die keine KI ersetzen kann. Dies sind die unverzichtbaren Grundlagen — die Dinge, die alles andere erst möglich machen.

## Die Kurzliste

| Fähigkeit | Warum sie unverzichtbar ist |
|-----------|---------------------------|
| **Git** | Ihr Sicherheitsnetz — alles rückgängig machen, mutig verzweigen, nie Arbeit verlieren |
| **TDD** | Die Methodik, die KI-generierten Code ehrlich hält |
| **Terminal-Kenntnisse** | KI-Tools leben im Terminal; Sie müssen ihre Ausgabe lesen können |
| **Englisch** | Docs, Fehler und KI-Prompts funktionieren alle am besten auf Englisch |
| **Geschmack** | KI generiert Optionen; Sie entscheiden, welche richtig ist |

Das ist es. Fünf Dinge. Alles andere — Sprachsyntax, Framework-APIs, Designmuster — übernimmt die KI für Sie.[^1]

## Git — Ihr Sicherheitsnetz

Git ist das einzeln wichtigste Tool in Ihrem Arsenal. Nicht weil Sie Rebasing oder Cherry-Picking meistern müssen — das übernimmt die KI — sondern weil Git Ihnen **furchtloses Experimentieren** gibt.[^2]

### Was Sie tatsächlich wissen müssen

| Befehl | Was er tut | Wann Sie ihn verwenden |
|--------|-----------|----------------------|
| `git status` | Zeigt, was sich geändert hat | Vor und nach jeder KI-Sitzung |
| `git diff` | Zeigt genaue Änderungen | Überprüfen, was die KI schrieb, bevor Sie committen |
| `git add` + `git commit` | Einen Checkpoint speichern | Nach jedem funktionierenden Zustand |
| `git log` | Historie der Änderungen | Wenn Sie verstehen müssen, was passiert ist |
| `git stash` | Änderungen vorübergehend ablegen | Wenn Sie einen anderen Ansatz ausprobieren möchten |
| `git checkout -- file` | Änderungen an einer Datei rückgängig machen | Wenn die KI etwas verschlechtert hat |
| `git worktree` | An mehreren Branches gleichzeitig arbeiten | Wenn Sie Ideen parallel erkunden möchten |

### Das mentale Modell

Stellen Sie sich Git als **unendliches Rückgängig** vor. Jeder Commit ist ein Speicherpunkt, zu dem Sie zurückkehren können. Das bedeutet:

- **Riskante Änderungen frei ausprobieren** — Sie können immer zurückgehen
- **KI experimentieren lassen** — wenn sie etwas kaputt macht, zurückrollen
- **An mehreren Ideen arbeiten** — Branches lassen Sie parallel erkunden
- **Vor dem Akzeptieren überprüfen** — `git diff` zeigt Ihnen genau, was die KI geändert hat

Die KI erstellt Commits, Branches und Pull Requests für Sie. Aber Sie sollten verstehen, was das ist, denn Sie sind derjenige, der entscheidet, wann gespeichert, wann verzweigt und wann zusammengeführt wird.

### Git-Worktrees — Parallele Universen

Eine Git-Funktion, die es sich früh zu lernen lohnt, sind **Worktrees**. Ein Worktree ermöglicht es Ihnen, einen anderen Branch in einem separaten Verzeichnis auszuchecken — ohne Ihre aktuelle Arbeit zu wechseln:

```bash
# Einen Worktree für ein neues Feature erstellen
git worktree add ../my-feature -b feature/new-idea

# Darin arbeiten
cd ../my-feature
claude    # Eine KI-Sitzung in diesem Branch starten

# Zurück zu Ihrer Hauptarbeit — unberührt
cd ../vmark
```

Dies ist besonders leistungsstark mit KI-Coding-Tools: Sie können eine KI-Sitzung haben, die auf einem Feature-Branch experimentiert, während Ihr Hauptbranch sauber und funktionierend bleibt. Wenn das Experiment fehlschlägt, löschen Sie einfach das Worktree-Verzeichnis. Kein Chaos, kein Risiko.

::: warning Git nicht überspringen
Ohne Git kann eine einzelne schlechte KI-Bearbeitung stundenlange Arbeit ohne Möglichkeit zur Rückkehr ruinieren. Mit Git ist der schlimmste Fall immer `git checkout -- .` und Sie sind zurück zu Ihrem letzten Speicherpunkt. Lernen Sie zuerst die Git-Grundlagen.
:::

## TDD — Wie Sie KI ehrlich halten

Test-Driven Development ist die Methodik, die KI-Coding von „hoffe, dass es funktioniert" in „beweise, dass es funktioniert" verwandelt. Es ist nicht nur eine gute Praxis — es ist Ihr primärer Mechanismus zur **Verifizierung**, dass KI-generierter Code tatsächlich das tut, was Sie verlangt haben.[^3]

### Der ROT-GRÜN-REFAKTORIEREN-Zyklus

TDD folgt einer strengen Dreischritt-Schleife:

```
1. ROT       — Schreiben Sie einen Test, der das beschreibt, was Sie wollen. Er schlägt fehl.
2. GRÜN      — Bitten Sie die KI, den minimalen Code zum Bestehen des Tests zu schreiben.
3. REFAKTORIEREN — Aufräumen ohne das Verhalten zu ändern. Tests bestehen noch.
```

Dies funktioniert bemerkenswert gut mit KI-Coding-Tools, weil:

| Schritt | Ihre Rolle | KI-Rolle |
|---------|-----------|---------|
| ROT | Das erwartete Verhalten beschreiben | Beim Schreiben der Test-Assertion helfen |
| GRÜN | Überprüfen, ob der Test besteht | Die Implementierung schreiben |
| REFAKTORIEREN | Beurteilen, ob der Code sauber genug ist | Das Aufräumen durchführen |

### Warum TDD mit KI wichtiger ist

Wenn Sie Code selbst schreiben, verstehen Sie ihn implizit — Sie wissen, was er tut, weil Sie ihn geschrieben haben. Wenn KI Code schreibt, brauchen Sie einen **externen Verifizierungsmechanismus**. Tests sind dieser Mechanismus.[^4]

Ohne Tests passiert Folgendes:

1. Sie bitten die KI, eine Funktion hinzuzufügen
2. Die KI schreibt 200 Zeilen Code
3. Sie lesen ihn, er *sieht* richtig aus
4. Sie veröffentlichen ihn
5. Er bricht etwas, das Sie nicht bemerkt haben — ein subtiler Edge Case, ein Typfehler, ein Off-by-One-Fehler

Mit TDD:

1. Sie beschreiben das Verhalten als Test (die KI hilft Ihnen, ihn zu schreiben)
2. Der Test schlägt fehl — bestätigt, dass er etwas Echtes testet
3. Die KI schreibt Code, damit er besteht
4. Sie führen den Test aus — er besteht
5. Sie haben einen **Beweis**, dass es funktioniert, kein Gefühl

### Wie ein Test aussieht

Sie müssen Tests nicht von Grund auf schreiben. Beschreiben Sie, was Sie wollen, in einfacher Sprache, und die KI schreibt den Test. Aber Sie sollten einen Test **lesen** können:

```ts
// „Wenn der Benutzer ein Dokument speichert, sollte das geänderte Flag gelöscht werden"
it("clears modified flag after save", () => {
  // Setup: Dokument als geändert markieren
  store.markModified("doc-1");
  expect(store.isModified("doc-1")).toBe(true);

  // Aktion: Das Dokument speichern
  store.save("doc-1");

  // Überprüfen: Das geänderte Flag ist gelöscht
  expect(store.isModified("doc-1")).toBe(false);
});
```

Das Muster ist immer dasselbe: **Setup**, **Aktion**, **Überprüfen**. Sobald Sie dieses Muster erkennen, können Sie jeden Test lesen — und was noch wichtiger ist, Sie können der KI sagen, was als nächstes zu testen ist.

### Edge Cases — Wo Fehler leben

Die eigentliche Kraft von TDD liegt in **Edge Cases** — den ungewöhnlichen Eingaben und Grenzwertbedingungen, wo Fehler sich verstecken. KI ist überraschend schlecht darin, selbst daran zu denken.[^5] Aber Sie können sie anstoßen:

> „Was passiert, wenn der Dateiname leer ist?"
> „Was wenn der Benutzer die Speichern-Schaltfläche doppelt klickt?"
> „Was wenn das Netzwerk mitten in einer Anfrage abbricht?"
> „Was ist mit einer Datei mit Unicode-Zeichen im Namen?"

Jede davon wird zu einem Test. Jeder Test wird zu einer Garantie. Je mehr Edge Cases Sie sich vorstellen, desto robuster wird Ihre Software. Hier kombinieren sich menschlicher **Geschmack** und KI-**Implementierungsgeschwindigkeit**, um etwas zu produzieren, das keiner von beiden alleine erreichen könnte.

### TDD in der Praxis mit KI

Hier ist ein echter Arbeitsablauf:

```
Sie:   Füge eine Funktion hinzu, die prüft, ob ein Dateiname gültig ist.
       Beginne mit einem fehlschlagenden Test.

KI:    [Schreibt Test] it("rejects empty filenames", () => { ... })
       [Test schlägt fehl — ROT ✓]

Sie:   Lass ihn jetzt bestehen.

KI:    [Schreibt isValidFilename()]
       [Test besteht — GRÜN ✓]

Sie:   Tests hinzufügen für: nur Leerzeichen, Pfadtrenner,
       Namen länger als 255 Zeichen, Null-Bytes.

KI:    [Schreibt 4 weitere Tests, einige schlagen fehl]
       [Aktualisiert Funktion, um alle Fälle zu behandeln]
       [Alle Tests bestehen — GRÜN ✓]

Sie:   Gut. Refaktorieren wenn nötig.

KI:    [Vereinfacht den Regex, Tests bestehen weiterhin — REFAKTORIEREN ✓]
```

Sie haben keine einzige Codezeile geschrieben. Aber Sie haben jede Entscheidung getroffen. Die Tests beweisen, dass der Code funktioniert. Und wenn jemand die Funktion später ändert, fangen die Tests Regressionen ab.

::: tip Die Coverage-Sperrklinke
VMark erzwingt Test-Coverage-Schwellenwerte — wenn die Coverage unter die Untergrenze fällt, schlägt der Build fehl. Das bedeutet, jede neue Funktion *muss* Tests haben. Die KI weiß das und schreibt automatisch Tests, aber Sie sollten überprüfen, dass diese sinnvolles Verhalten testen, nicht nur Codezeilen.
:::

## Terminal-Kenntnisse

KI-Coding-Tools sind Befehlszeilenprogramme. Claude Code, Codex CLI, Gemini CLI — sie laufen alle in einem Terminal. Sie müssen keine Hunderte von Befehlen auswendig kennen, aber Sie müssen mit einer Handvoll vertraut sein:

```bash
cd ~/projects/vmark      # In ein Verzeichnis navigieren
ls                        # Dateien auflisten
git status                # Sehen, was sich geändert hat
git log --oneline -5      # Neueste Commits
pnpm install              # Abhängigkeiten installieren
pnpm test                 # Tests ausführen
```

Die KI schlägt Ihnen Befehle vor und führt sie aus. Ihre Aufgabe ist es, **die Ausgabe zu lesen** und zu verstehen, ob Dinge erfolgreich waren oder fehlgeschlagen sind. Ein Testfehler sieht anders aus als ein Build-Fehler. Ein „Permission denied" ist anders als „File not found". Sie müssen diese nicht selbst beheben — aber Sie müssen beschreiben, was Sie sehen, damit die KI es beheben kann.

::: tip Hier anfangen
Wenn Sie nie ein Terminal verwendet haben, beginnen Sie mit [The Missing Semester](https://missing.csail.mit.edu/) vom MIT — speziell die erste Vorlesung über Shell-Tools. Eine Stunde Übung gibt Ihnen genug, um mit KI-Coding-Tools zu arbeiten.
:::

## Englischkenntnisse

Es geht nicht darum, perfekte Prosa zu schreiben. Es geht um **Leseverständnis** — Fehlermeldungen, Dokumentation und KI-Erklärungen zu verstehen. Das gesamte Software-Ökosystem läuft auf Englisch:[^6]

- **Fehlermeldungen** sind auf Englisch
- **Dokumentation** wird zuerst (und oft nur) auf Englisch geschrieben
- **Stack Overflow**, GitHub Issues und Tutorials sind überwiegend englisch
- **KI-Modelle performen messbar besser** mit englischen Prompts (siehe [Warum englische Prompts besseren Code produzieren](/de/guide/users-as-developers/prompt-refinement))

Sie müssen nicht fließend schreiben. Sie müssen:

1. **Lesen** einer Fehlermeldung und den wesentlichen Inhalt verstehen
2. **Suchen** nach technischen Begriffen effektiv
3. **Beschreiben**, was Sie von der KI wollen, klar genug

Wenn Englisch nicht Ihre Muttersprache ist, übersetzt und verfeinert VMark's `::`-Prompt-Hook Ihre Prompts automatisch. Aber die Antworten der KI zu lesen — die auf Englisch sind — ist etwas, was Sie ständig tun werden.

## Geschmack — Das Einzige, das KI nicht ersetzen kann

Dies ist am schwierigsten zu definieren und am wichtigsten. **Geschmack** ist zu wissen, wie gut aussieht — auch wenn Sie es noch nicht selbst bauen können.[^7]

Wenn KI Ihnen drei Ansätze zur Lösung eines Problems anbietet, sagt Ihnen Geschmack:

- Der einfache ist besser als der clevere
- Die Lösung mit weniger Abhängigkeiten ist vorzuziehen
- Der Code, der sich wie Prosa liest, schlägt „optimierten" Code
- Eine 10-Zeilen-Funktion ist verdächtig, wenn 5 Zeilen reichen würden

### Wie man Geschmack entwickelt

1. **Gute Software nutzen** — bemerken, was sich richtig anfühlt und was ungeschickt ist
2. **Guten Code lesen** — populäre Open-Source-Projekte auf GitHub durchstöbern
3. **Die Ausgabe lesen** — wenn die KI Code generiert, ihn lesen, auch wenn man ihn nicht schreiben kann
4. **„Warum" fragen** — wenn die KI eine Wahl trifft, sie bitten, die Kompromisse zu erklären
5. **Iterieren** — wenn etwas falsch wirkt, ist es wahrscheinlich falsch. Bitten Sie die KI, es erneut zu versuchen

Geschmack zieht sich zusammen. Je mehr Code man liest (sogar KI-generierten Code), desto besser werden die Instinkte. Nach einigen Monaten KI-gestützter Entwicklung werden Sie Probleme fangen, die die KI übersieht — nicht weil Sie mehr Syntax kennen, sondern weil Sie wissen, wie sich das **Ergebnis anfühlen sollte**.

::: tip Der Geschmackstest
Nachdem die KI eine Aufgabe abgeschlossen hat, fragen Sie sich: „Wenn ich ein Nutzer wäre, würde sich das richtig anfühlen?" Wenn die Antwort kein sofortiges Ja ist, sagen Sie der KI, was sich falsch anfühlt. Sie müssen die Lösung nicht kennen — nur das Gefühl.
:::

## Was Sie nicht brauchen

Genauso wichtig wie das Kennen der Grundlagen ist es, zu wissen, was Sie sicher überspringen können:

| Das brauchen Sie nicht | Weil |
|------------------------|------|
| Beherrschung der Programmiersprache | KI schreibt den Code; Sie überprüfen ihn |
| Framework-Expertise | KI kennt React, Rails, Django besser als die meisten Menschen |
| Algorithmuskenntnisse | KI implementiert Algorithmen; Sie beschreiben das Ziel |
| DevOps-Fähigkeiten | KI schreibt CI-Konfigurationen, Docker-Dateien, Deployment-Skripte |
| Auswendig gelernte Designmuster | KI wendet das richtige Muster an, wenn Sie das Verhalten beschreiben |
| Jahre an Erfahrung | Frische Perspektive + KI > Erfahrung ohne KI[^8] |

Das bedeutet nicht, dass diese Fähigkeiten wertlos sind — sie machen Sie schneller und effektiver. Aber sie sind keine **Voraussetzungen** mehr. Sie können sie schrittweise, im Laufe der Arbeit, mit der KI als Lehrer lernen.

## Der Zinseszinseffekt

Diese fünf Fähigkeiten — Git, TDD, Terminal, Englisch und Geschmack — addieren sich nicht nur. Sie **multiplizieren sich**.[^9]

- Git-Sicherheit lässt Sie frei experimentieren, was Geschmack schneller entwickelt
- TDD gibt Ihnen Vertrauen in die KI-Ausgabe, sodass Sie schneller vorankommen können
- Terminal-Flüssigkeit lässt Sie Tests und Git-Befehle ohne Reibung ausführen
- Englisch-Verständnis lässt Sie Fehlermeldungen und Dokumentation lesen
- Geschmack macht Ihre Prompts präziser, was besseren Code produziert
- Besserer Code gibt Ihnen bessere Beispiele zum Lernen

Nach einigen Wochen KI-gestützter Entwicklung werden Sie Dinge verstehen, die Sie nie formell gelernt haben. Das ist der Zinseszinseffekt bei der Arbeit — und deshalb sind diese fünf Grundlagen, und nur diese fünf, wirklich unverzichtbar.

[^1]: Die „No-Code"- und „Low-Code"-Bewegungen haben seit Jahren versucht, Programmierbarrieren zu entfernen. KI-Coding-Tools erreichen dies effektiver, weil sie nicht einschränken, was man bauen kann — sie schreiben beliebigen Code in jeder Sprache, nach jedem Muster, basierend auf natürlichsprachlichen Beschreibungen. Siehe: Jiang, E. et al. (2022). [Discovering the Syntax and Strategies of Natural Language Programming with Generative Language Models](https://dl.acm.org/doi/10.1145/3491102.3501870). *CHI 2022*.

[^2]: Gits Branching-Modell verändert grundlegend, wie Menschen an Experimente herangehen. Forschungen zu Entwickler-Workflows zeigen, dass Teams, die häufige, kleine Commits mit Branches verwenden, deutlich wahrscheinlicher riskante Änderungen ausprobieren — weil die Kosten des Scheiterns nahe null sinken. Siehe: Bird, C. et al. (2009). [Does Distributed Development Affect Software Quality?](https://dl.acm.org/doi/10.1145/1555001.1555040). *ICSE 2009*.

[^3]: Test-Driven Development wurde 2002 von Kent Beck formalisiert und ist seitdem ein Eckpfeiler der professionellen Softwaretechnik geworden. Die Disziplin, zuerst Tests zu schreiben, zwingt Entwickler, Anforderungen vor der Implementierung zu klären — ein Vorteil, der noch mächtiger wird, wenn der „Entwickler" eine KI ist, die präzise Anweisungen benötigt. Siehe: Beck, K. (2002). [Test-Driven Development: By Example](https://www.oreilly.com/library/view/test-driven-development/0321146530/). Addison-Wesley.

[^4]: Studien zur KI-Codegenerierung zeigen konsistent, dass KI-generierter Code funktionale Tests zu niedrigeren Raten besteht als von Menschen geschriebener Code, es sei denn, er wird durch explizite Testfälle geleitet. Das Bereitstellen von Testfällen im Prompt erhöht die korrekte Codegenerierung um 20–40%. Siehe: Chen, M. et al. (2021). [Evaluating Large Language Models Trained on Code](https://arxiv.org/abs/2107.03374). *arXiv:2107.03374*.

[^5]: KI-Modelle performen systematisch schlechter bei Edge Cases und Grenzwertbedingungen. Sie neigen dazu, „Happy-Path"-Code zu generieren, der gewöhnliche Eingaben verarbeitet, aber bei ungewöhnlichen scheitert. Dies ist eine dokumentierte Einschränkung der transformer-basierten Codegenerierung — die Trainingsdaten sind auf typische Verwendungsmuster verzerrt. Siehe: Pearce, H. et al. (2022). [Examining Zero-Shot Vulnerability Repair with Large Language Models](https://arxiv.org/abs/2112.02125). *IEEE S&P 2022*.

[^6]: Englisch dominiert Programmierung und technische Dokumentation mit überwältigender Mehrheit. Die Analyse öffentlicher GitHub-Repositories zeigt, dass über 90% der README-Dateien und Code-Kommentare auf Englisch sind. Ähnlich sind die 23 Millionen Fragen auf Stack Overflow überwiegend auf Englisch. Siehe: Casalnuovo, C. et al. (2015). [Developer Onboarding in GitHub](https://dl.acm.org/doi/10.1145/2786805.2786854). *ESEC/FSE 2015*.

[^7]: „Geschmack" in der Softwaretechnik — die Fähigkeit, gutes Design von schlechtem zu unterscheiden — wird zunehmend als Kernkompetenz anerkannt. Fred Brooks schrieb, dass „großartige Designs von großartigen Designern kommen", nicht von großartigen Prozessen. Da KI die mechanischen Aspekte des Codierens übernimmt, wird dieses ästhetische Urteil zum primären menschlichen Beitrag. Siehe: Brooks, F. (2010). [The Design of Design](https://www.oreilly.com/library/view/the-design-of/9780321702081/). Addison-Wesley.

[^8]: Studien zur KI-gestützten Programmierung zeigen, dass Entwickler mit weniger Erfahrung oft mehr von KI-Tools profitieren als Experten — weil die Lücke zwischen „kann beschreiben" und „kann implementieren" mit KI-Unterstützung dramatisch schrumpft. Siehe: Peng, S. et al. (2023). [The Impact of AI on Developer Productivity](https://arxiv.org/abs/2302.06590). *arXiv:2302.06590*.

[^9]: Das Konzept des „Compound Learning" — wo grundlegende Fähigkeiten die Aneignung verwandter Fähigkeiten beschleunigen — ist in der Bildungsforschung gut etabliert. In der Programmierung insbesondere erschließt das Verständnis einiger Kernideen schnelles Lernen von allem, was darauf aufgebaut ist. Siehe: Sorva, J. (2012). [Visual Program Simulation in Introductory Programming Education](https://aaltodoc.aalto.fi/handle/123456789/3534). Aalto University.
