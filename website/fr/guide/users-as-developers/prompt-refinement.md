# Pourquoi les prompts en anglais produisent un meilleur code

Les outils de codage IA fonctionnent mieux quand vous leur donnez des prompts en anglais — même si l'anglais n'est pas votre langue maternelle. Le plugin [claude-english-buddy](https://github.com/xiaolai/claude-english-buddy-for-claude) corrige, traduit et affine automatiquement vos prompts.

## Pourquoi l'anglais compte pour le codage IA

### Les LLM pensent en anglais

Les grands modèles de langage traitent en interne toutes les langues à travers un espace de représentation fortement aligné sur l'anglais.[^1] Pré-traduire les prompts non anglais en anglais avant de les envoyer au modèle améliore de manière mesurable la qualité des résultats.[^2]

En pratique, un prompt chinois comme « 把这个函数改成异步的 » fonctionne — mais l'équivalent anglais « Convert this function to async » produit du code plus précis avec moins d'itérations.

### L'utilisation des outils hérite de la langue du prompt

Quand un outil de codage IA recherche sur le web, lit de la documentation ou consulte des références d'API, il utilise la langue de votre prompt pour ces requêtes. Les requêtes en anglais trouvent de meilleurs résultats parce que :

- Les docs officielles, Stack Overflow et les issues GitHub sont principalement en anglais
- Les termes de recherche techniques sont plus précis en anglais
- Les exemples de code et les messages d'erreur sont presque toujours en anglais

Un prompt en chinois portant sur « 状态管理 » risque de rechercher des ressources chinoises, manquant la documentation anglaise canonique. Les benchmarks multilingues montrent systématiquement des écarts de performance allant jusqu'à 24 % entre l'anglais et les autres langues — même des langues bien représentées comme le français ou l'allemand.[^3]

## Le plugin `claude-english-buddy`

`claude-english-buddy` est un plugin Claude Code qui intercepte chaque prompt et le traite selon l'un des quatre modes suivants :

| Mode | Déclencheur | Ce qui se passe |
|------|-------------|-----------------|
| **Correct** | Prompt en anglais avec des erreurs | Corrige l'orthographe et la grammaire, affiche les modifications |
| **Translate** | Langue non anglaise détectée (CJK, cyrillique, etc.) | Traduit en anglais, affiche la traduction |
| **Refine** | Préfixe `::` | Réécrit une saisie vague en un prompt précis et structuré |
| **Skip** | Texte court, commandes, URLs, code | Transmet tel quel |

Le plugin utilise Claude Haiku pour les corrections — rapide et économique, sans aucune interruption de votre flux de travail.

### Correction automatique (par défaut)

Tapez normalement. Le plugin détecte automatiquement la langue :

```
You type:    "refactor the autentication modul, its got too many responsibilties"

You see:     Refactor the authentication module. It has too many responsibilities.
             (autentication>authentication; modul>module; its got>it has;
              responsibilties>responsibilities)

Claude sees: the corrected version and responds normally.
```

Quand votre prompt est correct — silence. Pas de bruit. Le silence signifie que tout est correct.

### Traduction

Les prompts non anglais sont automatiquement traduits :

```
You type:    这个组件渲染太慢了，每次父组件更新都会重新渲染，帮我优化一下

You see:     Optimize this component to prevent unnecessary re-renders when
             the parent component updates.
             (Chinese)

Claude sees: the English translation.
```

### Affinement de prompt avec `::`

Préfixez votre prompt avec `::` pour transformer une idée brute en un prompt précis :

```
:: make the search faster it's really slow with big files
```

Devient :

```
Optimize the search implementation for large files. Profile the current
bottleneck and consider debouncing, web workers, or incremental matching.
```

Le préfixe `::` fonctionne dans toutes les langues — il traduit et restructure en une seule étape.[^4]

::: tip Quand le plugin reste silencieux
Les commandes courtes (`yes`, `continue`, `option 2`), les commandes slash, les URLs et les extraits de code sont transmis tels quels. Pas d'allers-retours inutiles.
:::

## Suivre vos progrès

Le plugin enregistre chaque correction. Au fil des semaines, vous pouvez constater l'amélioration de votre anglais :

| Commande | Ce qu'elle affiche |
|----------|-------------------|
| `/claude-english-buddy:today` | Corrections du jour, erreurs récurrentes, leçons, tendance |
| `/claude-english-buddy:stats` | Taux d'erreur à long terme et trajectoire d'amélioration |
| `/claude-english-buddy:mistakes` | Schémas récurrents de tous les temps — vos angles morts |

## Installation

Installez le plugin dans Claude Code :

```bash
/plugin marketplace add xiaolai/claude-plugin-marketplace
/plugin install claude-english-buddy@xiaolai
```

Aucune configuration supplémentaire nécessaire — la correction automatique démarre immédiatement.

### Configuration optionnelle

Créez un fichier `.claude-english-buddy.json` à la racine de votre projet pour personnaliser le comportement :

```json
{
  "auto_correct": true,
  "summary_language": "Chinese",
  "strictness": "standard",
  "domain_terms": ["ProseMirror", "Tiptap", "Zustand"]
}
```

| Paramètre | Options | Valeur par défaut |
|-----------|---------|-------------------|
| `auto_correct` | `true` / `false` | `true` |
| `strictness` | `gentle`, `standard`, `strict` | `standard` |
| `summary_language` | Tout nom de langue, ou `null` pour désactiver | `null` |
| `domain_terms` | Tableau de termes à conserver tels quels | `[]` |

Lorsque `summary_language` est défini, Claude ajoute un bref résumé dans cette langue à la fin de chaque réponse — utile quand vous souhaitez avoir les décisions clés dans votre langue maternelle.[^5]

[^1]: Les LLM multilingues prennent leurs décisions clés dans un espace de représentation le plus proche de l'anglais, quelle que soit la langue d'entrée ou de sortie. En utilisant un logit lens pour sonder les représentations internes, les chercheurs ont constaté que les mots sémantiquement chargés (comme « water » ou « sun ») sont sélectionnés en anglais avant d'être traduits dans la langue cible. Le guidage par activation est également plus efficace lorsqu'il est calculé en anglais. Voir : Schut, L., Gal, Y., & Farquhar, S. (2025). [Do Multilingual LLMs Think In English?](https://arxiv.org/abs/2502.15603). *arXiv:2502.15603*.

[^2]: Pré-traduire systématiquement les prompts non anglais en anglais avant l'inférence améliore la qualité des sorties des LLM à travers de multiples tâches et langues. Les chercheurs décomposent les prompts en quatre parties fonctionnelles (instruction, contexte, exemples, sortie) et montrent que la traduction sélective de composants spécifiques peut être plus efficace que la traduction intégrale. Voir : Watts, J., Batsuren, K., & Gurevych, I. (2025). [Beyond English: The Impact of Prompt Translation Strategies across Languages and Tasks in Multilingual LLMs](https://arxiv.org/abs/2502.09331). *arXiv:2502.09331*.

[^3]: Le benchmark MMLU-ProX — 11 829 questions identiques en 29 langues — a révélé des écarts de performance allant jusqu'à 24,3 % entre l'anglais et les langues à faibles ressources. Même des langues bien représentées comme le français et l'allemand montrent une dégradation mesurable. L'écart corrèle fortement avec la proportion de chaque langue dans le corpus de pré-entraînement du modèle, et le simple fait d'augmenter la taille du modèle ne l'élimine pas. Voir : [MMLU-ProX: A Multilingual Benchmark for Advanced LLM Evaluation](https://mmluprox.github.io/) (2024) ; Palta, S. & Rudinger, R. (2024). [Language Ranker: A Metric for Quantifying LLM Performance Across High and Low-Resource Languages](https://arxiv.org/abs/2404.11553).

[^4]: Le few-shot prompting — fournir des exemples d'entrée/sortie dans le prompt — améliore considérablement les performances des LLM sur les tâches. L'article fondateur sur GPT-3 a montré que si les performances en zero-shot s'améliorent régulièrement avec la taille du modèle, les performances en few-shot augmentent *plus rapidement*, atteignant parfois un niveau compétitif avec les modèles fine-tunés. Les modèles plus grands sont plus aptes à apprendre à partir d'exemples en contexte. Voir : Brown, T., Mann, B., Ryder, N., et al. (2020). [Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165). *NeurIPS 2020*.

[^5]: Des prompts structurés et bien conçus surpassent systématiquement les instructions vagues dans les tâches de génération de code. Des techniques comme le raisonnement en chaîne de pensée, l'attribution de rôles et les contraintes de périmètre explicites améliorent toutes la précision au premier essai. Voir : Sahoo, P., Singh, A.K., Saha, S., et al. (2025). [Unleashing the Potential of Prompt Engineering for Large Language Models](https://www.sciencedirect.com/science/article/pii/S2666389925001084). *Patterns*.
