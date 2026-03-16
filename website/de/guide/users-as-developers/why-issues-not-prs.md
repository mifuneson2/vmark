# Warum wir Issues, nicht Pull Requests akzeptieren

VMark akzeptiert keine Pull Requests. Wir begrüßen Issues — je detaillierter, desto besser. Diese Seite erklärt warum.

## Die Kurzversion

VMark ist vibe-kodiert. Die gesamte Codebasis wird von einer KI unter der Aufsicht eines einzigen Maintainers geschrieben. Wenn jemand einen Pull Request einreicht, gibt es ein grundlegendes Problem: **Ein Mensch kann den KI-generierten Code eines anderen Menschen nicht sinnvoll überprüfen**. Der Reviewer versteht den Code des Contributors nicht, weil keiner von ihnen ihn im traditionellen Sinne geschrieben hat — ihre KIs haben es getan.

Issues haben dieses Problem nicht. Ein gut geschriebenes Issue beschreibt *was* passieren soll. Die KI des Maintainers behebt dann die Codebasis mit vollem Kontext der Projektkonventionen, Test-Suite und Architektur. Das Ergebnis ist konsistent, getestet und wartbar.

## Was „Vibe-kodiert" eigentlich bedeutet

Der Begriff „Vibe-Coding" wurde von Andrej Karpathy Anfang 2025 geprägt, um einen Programmierstil zu beschreiben, bei dem Sie beschreiben, was Sie wollen, und die KI den Code schreiben lassen. Sie lenken die Richtung, aber Sie schreiben — oder lesen oft sogar — nicht jede Zeile.[^1]

VMark geht dabei weiter als die meisten Projekte. Das Repository wird geliefert mit:

- **`AGENTS.md`** — Projektregeln, die jedes KI-Tool beim Start liest
- **`.claude/rules/`** — 15+ Regeldateien zu TDD, Design-Tokens, Komponentenmustern, Barrierefreiheit und mehr
- **Slash-Befehle** — Vorgefertigte Workflows zum Auditieren, Beheben und Verifizieren von Code
- **Modellübergreifende Verifikation** — Claude schreibt, Codex prüft (siehe [Modellübergreifende Verifikation](/de/guide/users-as-developers/cross-model-verification))

Die KI generiert nicht einfach zufälligen Code. Sie operiert innerhalb eines dichten Netzwerks von Einschränkungen — Konventionen, Tests und automatisierte Prüfungen — die die Codebasis konsistent halten. Aber das funktioniert nur, wenn **eine KI-Sitzung den vollen Kontext** dieser Einschränkungen hat.

## Die Verständnislücke

Hier ist das Kernproblem mit KI-generierten Pull Requests: Niemand liest sie vollständig.

Forschung von der ACM-Konferenz „Foundations of Software Engineering" ergab, dass Entwickler — insbesondere solche, die den Code nicht selbst geschrieben haben — Schwierigkeiten haben, LLM-generierten Code zu verstehen. Die Studie mit dem Titel *„I Would Have Written My Code Differently": Beginners Struggle to Understand LLM-Generated Code* dokumentierte, wie selbst technisch fähige Entwickler Schwierigkeiten haben, über Code zu urteilen, den sie nicht verfasst haben, wenn eine KI ihn geschrieben hat.[^2]

Das ist nicht nur ein Anfängerproblem. Eine Analyse von über 500.000 Pull Requests durch CodeRabbit ergab, dass KI-generierte PRs **1,7-mal mehr Probleme** enthalten als von Menschen geschriebene PRs — darunter 75 % mehr Logik- und Korrektheitsfehler. Das größte Problem? Das sind genau die Fehler, die beim Review vernünftig aussehen, wenn Sie den Code nicht Schritt für Schritt durchgehen.[^3]

Die Rechnung wird schlechter, wenn beide Seiten KI verwenden:

| Szenario | Versteht Reviewer den Code? |
|----------|-----------------------------|
| Mensch schreibt, Mensch überprüft | Ja — Reviewer kann über den Intent urteilen |
| KI schreibt, ursprünglicher Autor überprüft | Teilweise — Autor hat die KI geleitet und hat Kontext |
| KI schreibt, anderer Mensch überprüft | Schlecht — Reviewer hat weder Autoren- noch KI-Sitzungskontext |
| KI schreibt für Person A, KI überprüft für Person B | Keiner der Menschen versteht den Code tiefgreifend |

VMark befindet sich in der letzten Zeile. Wenn ein Contributor einen PR öffnet, der von seiner KI generiert wurde, und die KI des Maintainers ihn überprüft, haben die zwei Menschen in der Schleife das geringste Verständnis aller Szenarien. Das ist kein Rezept für Qualitätssoftware.

## Warum KI-generierte PRs sich von menschlichen PRs unterscheiden

Traditionelles Code-Review funktioniert aufgrund einer gemeinsamen Grundlage: Sowohl Autor als auch Reviewer verstehen die Programmiersprache, die Muster und die Idiome. Der Reviewer kann die Ausführung des Codes mental simulieren und Inkonsistenzen erkennen.

Mit KI-generiertem Code erodiert diese gemeinsame Grundlage. Forschung zeigt mehrere spezifische Fehlermuster:

**Konventionsdrift.** KI hat eine „überwältigende Tendenz, die bestehenden Konventionen innerhalb eines Repositories nicht zu verstehen" und generiert ihre eigene leicht unterschiedliche Version, wie ein Problem gelöst werden soll.[^4] Die KI-Sitzung jedes Contributors produziert Code, der isoliert funktioniert, aber mit den Mustern des Projekts kollidiert. In VMark, wo wir spezifische Zustand-Store-Muster, CSS-Token-Nutzung und Plugin-Strukturen erzwingen, wäre Konventionsdrift verheerend.

**Kontextisolierung.** Vibe-kodierte Features werden oft „isoliert generiert, wo die KI vernünftige Implementierungen für jede Eingabeaufforderung erstellt, aber keine Erinnerung an Architekturentscheidungen aus früheren Sitzungen hat".[^5] Die KI eines Contributors kennt VMarcks 15 Regeldateien, seine modellübergreifende Audit-Pipeline oder seine spezifischen ProseMirror-Plugin-Konventionen nicht — es sei denn, der Contributor hat das alles mühsam konfiguriert.

**Review-Engpass.** Entwickler, die KI verwenden, erledigen 21 % mehr Aufgaben und mergen 98 % mehr Pull Requests, aber die PR-Review-Zeit steigt um 91 %.[^6] Die Geschwindigkeit der KI-Code-Generierung schafft einen Feuerschlauch von Code, der die menschliche Review-Kapazität überwältigt. Für einen einzelnen Maintainer ist das unhaltbar.

## Der SQLite-Präzedenzfall

VMark ist nicht das erste Projekt, das Beiträge einschränkt. SQLite — eine der am weitesten verbreiteten Softwarebibliotheken der Welt — war seit seiner gesamten Geschichte „Open Source, aber nicht Open Contribution". Das Projekt akzeptiert keine Patches von zufälligen Personen im Internet. Contributors können Änderungen vorschlagen und Proof-of-Concept-Code einschließen, aber die Kernentwickler schreiben Patches typischerweise von Grund auf neu.[^7]

SQLites Begründung ist anders (sie müssen den Public-Domain-Status aufrechterhalten), aber das Ergebnis ist dasselbe: **Qualität wird aufrechterhalten, indem ein einzelnes Team mit vollem Kontext** den gesamten Code schreibt. Externe Beiträge werden durch Bug-Berichte und Feature-Vorschläge kanalisiert, anstatt direkte Code-Änderungen.

Andere bemerkenswerte Projekte haben ähnliche Haltungen eingenommen. Das Benevolent Dictator for Life (BDFL)-Modell — historisch von Python (Guido van Rossum), Linux (Linus Torvalds) und vielen anderen verwendet — konzentriert die endgültige Autorität in einer Person, die architektonische Kohärenz gewährleistet.[^8] VMark macht dies explizit: Der „Diktator" ist die KI, beaufsichtigt vom Maintainer.

## Warum Issues besser funktionieren

Ein Issue ist eine **Spezifikation**, keine Implementierung. Es beschreibt, was falsch ist oder was benötigt wird, ohne sich auf eine bestimmte Lösung festzulegen. Dies ist eine bessere Schnittstelle zwischen Contributors und einer KI-gepflegten Codebasis:

| Beitragstyp | Was es bietet | Risiko |
|-------------|---------------|--------|
| Pull Request | Code, den Sie verstehen, überprüfen, testen und warten müssen | Konventionsdrift, Kontextverlust, Review-Belastung |
| Issue | Eine Beschreibung des gewünschten Verhaltens | Keines — der Maintainer entscheidet ob und wie er handelt |

### Was ein großartiges Issue ausmacht

Die besten Issues lesen sich wie Anforderungsdokumente:

1. **Aktuelles Verhalten** — Was jetzt passiert (mit Reproduktionsschritten bei Bugs)
2. **Erwartetes Verhalten** — Was stattdessen passieren soll
3. **Kontext** — Warum dies wichtig ist, was Sie versucht haben zu tun
4. **Umgebung** — Betriebssystem, VMark-Version, relevante Einstellungen
5. **Screenshots oder Aufnahmen** — Wenn visuelles Verhalten betroffen ist

Sie dürfen KI verwenden, um Issues zu schreiben. Tatsächlich empfehlen wir es. Ein KI-Assistent kann Ihnen helfen, ein detailliertes, gut strukturiertes Issue in Minuten zu erstellen. Die Ironie ist beabsichtigt: **KI ist großartig darin, Probleme klar zu beschreiben, und KI ist großartig darin, klar beschriebene Probleme zu lösen.** Der Engpass ist die unscharfe Mitte — die Lösung einer anderen KI zu verstehen — die Issues elegant umgehen.

### Was nach der Einreichung eines Issues passiert

1. Der Maintainer liest und triagiert das Issue
2. Die KI erhält das Issue als Kontext, zusammen mit vollem Wissen der Codebasis
3. Die KI schreibt einen Fix nach TDD (zuerst Test, dann Implementierung)
4. Ein zweites KI-Modell (Codex) prüft den Fix unabhängig
5. Automatisierte Gates laufen (`pnpm check:all` — Lint, Tests, Coverage, Build)
6. Der Maintainer überprüft die Änderung im Kontext und mergt sie

Diese Pipeline produziert Code, der:
- **Konventionskonform** ist — Die KI liest die Regeldateien bei jeder Sitzung
- **Getestet** ist — TDD ist obligatorisch; Coverage-Schwellenwerte werden erzwungen
- **Kreuzverifiziert** ist — Ein zweites Modell prüft auf Logikfehler, Sicherheit und toten Code
- **Architektonisch kohärent** ist — Eine KI-Sitzung mit vollem Kontext, nicht Fragmente von vielen

## Das größere Bild

Das KI-Zeitalter zwingt zu einem Überdenken, wie Open-Source-Beiträge funktionieren. Das traditionelle Modell — Fork, Branch, Code, PR, Review, Merge — setzte voraus, dass Menschen Code schreiben und andere Menschen ihn lesen können. Wenn KI den Code generiert, schwächen beide Annahmen.

Eine Umfrage professioneller Entwickler aus 2025 ergab, dass sie „kein Vibe-Coding betreiben; stattdessen kontrollieren sie Agenten sorgfältig durch Planung und Überwachung".[^9] Der Schwerpunkt liegt auf **Kontrolle und Kontext** — genau das, was verloren geht, wenn ein PR aus der unverbundenen KI-Sitzung eines externen Contributors ankommt.

Wir glauben, dass die Zukunft des Open-Source im KI-Zeitalter anders aussieht:

- **Issues werden zum primären Beitrag** — Probleme beschreiben ist eine universelle Fähigkeit
- **Maintainer kontrollieren die KI** — Ein Team mit vollem Kontext produziert konsistenten Code
- **Modellübergreifende Verifikation ersetzt menschliches Review** — Adversarielle KI-Prüfung erkennt, was Menschen übersehen
- **Tests ersetzen Vertrauen** — Automatisierte Gates, nicht Reviewer-Urteil, bestimmen ob Code korrekt ist

VMark experimentiert offen mit diesem Modell. Es ist möglicherweise nicht der richtige Ansatz für jedes Projekt. Aber für eine vibe-kodierte Codebasis, die von einer Person mit KI-Tools gepflegt wird, ist es der Ansatz, der die beste Software produziert.

## So tragen Sie bei

**Reichen Sie ein Issue ein.** Das ist alles. Je mehr Details Sie bereitstellen, desto besser wird der Fix sein.

- **[Bug-Bericht](https://github.com/xiaolai/vmark/issues/new?template=bug_report.yml)**
- **[Feature-Anfrage](https://github.com/xiaolai/vmark/issues/new?template=feature_request.yml)**

Ihr Issue wird zur Spezifikation der KI. Ein klares Issue führt zu einem korrekten Fix. Ein vages Issue führt zu hin und her. Investieren Sie in die Beschreibung — sie bestimmt direkt die Qualität des Ergebnisses.

---

[^1]: Karpathy, A. (2025). [Vibe coding](https://en.wikipedia.org/wiki/Vibe_coding). Ursprünglich in einem Social-Media-Beitrag beschrieben, trat der Begriff schnell in das Mainstream-Entwicklervokabular ein. Wikipedia stellt fest, dass Vibe-Coding „auf KI-Tools zurückgreift, um Code aus Prompts in natürlicher Sprache zu generieren, was die Notwendigkeit, dass der Entwickler Code manuell schreibt, reduziert oder eliminiert."

[^2]: Jury, J. et al. (2025). ["I Would Have Written My Code Differently": Beginners Struggle to Understand LLM-Generated Code](https://dl.acm.org/doi/pdf/10.1145/3696630.3731663). *FSE Companion '25*, 33rd ACM International Conference on the Foundations of Software Engineering. Die Studie ergab, dass Entwickler, die den KI-Prompt nicht verfasst hatten, erhebliche Schwierigkeiten hatten, den generierten Code zu verstehen und darüber zu urteilen.

[^3]: CodeRabbit. (2025). [AI-Assisted Pull Requests Report](https://www.helpnetsecurity.com/2025/12/23/coderabbit-ai-assisted-pull-requests-report/). Analyse von 500.000+ Pull Requests ergab, dass KI-generierte PRs 10,83 Probleme pro PR enthalten gegenüber 6,45 bei menschlichen PRs (1,7-mal mehr), mit 75 % mehr Logik- und Korrektheitsfehlern und 1,4-mal mehr kritischen Problemen.

[^4]: Osmani, A. (2025). [Code Review in the Age of AI](https://addyo.substack.com/p/code-review-in-the-age-of-ai). Analyse, wie KI-generierter Code mit bestehenden Codebasen interagiert, und die Tendenz der KI, inkonsistente Muster zu erzeugen, die von etablierten Projektkonventionen abweichen.

[^5]: Weavy. (2025). [You Can't Vibe Code Your Way Out of a Vibe Coding Mess](https://www.weavy.com/blog/you-cant-vibe-code-your-way-out-of-a-vibe-coding-mess). Dokumentiert, wie vibe-kodierte Features, die in isolierten KI-Sitzungen generiert wurden, Architekturkonflikte erzeugen, wenn sie kombiniert werden, weil jede Sitzung sich nicht der Entscheidungen bewusst ist, die in anderen Sitzungen getroffen wurden.

[^6]: SoftwareSeni. (2025). [Why AI Coding Speed Gains Disappear in Code Reviews](https://www.softwareseni.com/why-ai-coding-speed-gains-disappear-in-code-reviews/). Berichtet, dass KI-unterstützte Entwickler zwar 21 % mehr Aufgaben erledigen und 98 % mehr PRs mergen, die PR-Review-Zeit aber um 91 % steigt — was zeigt, dass KI den Engpass vom Schreiben zum Überprüfen verlagert.

[^7]: SQLite. [SQLite Copyright](https://sqlite.org/copyright.html). SQLite ist seit seiner Entstehung „Open Source, nicht Open Contribution". Das Projekt akzeptiert keine Patches von externen Contributors, um den Public-Domain-Status und die Code-Qualität zu erhalten. Contributors können Änderungen vorschlagen, aber das Kernteam schreibt Implementierungen von Grund auf neu.

[^8]: Wikipedia. [Benevolent Dictator for Life](https://en.wikipedia.org/wiki/Benevolent_dictator_for_life). Das BDFL-Governance-Modell, das von Python, Linux und vielen anderen Projekten verwendet wird, konzentriert architektonische Autorität in einer Person, um Kohärenz zu erhalten. Bemerkenswerte BDFLs sind Guido van Rossum (Python), Linus Torvalds (Linux) und Larry Wall (Perl).

[^9]: Dang, H.T. et al. (2025). [Professional Software Developers Don't Vibe, They Control: AI Agent Use for Coding in 2025](https://arxiv.org/html/2512.14012). Umfrage professioneller Entwickler ergab, dass sie KI-Agenten durch Planung und Überwachung eng kontrollieren, anstatt den hands-off „Vibe-Coding"-Ansatz zu übernehmen.
