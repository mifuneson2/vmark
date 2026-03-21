# Combien coûterait la construction de VMark ?

::: info En bref
VMark compte environ 109 000 lignes de code de production et 206 000 lignes de code de test en TypeScript, Rust, CSS et Vue. Une équipe humaine aurait besoin de **4 239 jours-développeur** (~17 années-personnes) pour le construire de zéro. Aux tarifs du marché américain, cela représente **3,4 à 4,2 M$**. Il a été construit en **85 jours calendaires** par une seule personne avec l'assistance de l'IA, pour un coût d'environ **2 000 $** — soit un multiplicateur de productivité de ~50x et une réduction des coûts de ~99,9 %.
:::

## Pourquoi cette page existe

Une question revient sans cesse : *« Combien d'efforts VMark a-t-il réellement demandé ? »*

Ce n'est pas une page marketing. C'est une analyse transparente et fondée sur des données, utilisant de vraies métriques de code — pas des impressions. Chaque chiffre ici provient de `tokei` (comptage de lignes), `git log` (historique) et `vitest` (nombre de tests). Vous pouvez reproduire ces chiffres vous-même en clonant le dépôt.

## Métriques brutes

| Métrique | Valeur |
|----------|--------|
| Code de production (frontend TS/TSX) | 85 306 LOC |
| Code de production (backend Rust) | 10 328 LOC |
| Code de production (MCP server) | 4 627 LOC |
| CSS de production | 8 779 LOC |
| Données de localisation i18n | 10 130 LOC |
| Site web (Vue + TS + docs) | 4 421 LOC + 75 930 lignes de docs |
| **Code de test** | **206 077 LOC** (656 fichiers) |
| Nombre de tests | 17 255 tests |
| Documentation | 75 930 lignes (320 pages, 10 langues) |
| Commits | 1 993 sur 84 jours actifs |
| Durée calendaire | 85 jours (27 déc. 2025 — 21 mars 2026) |
| Contributeurs | 2 (1 humain + IA) |
| Taux de réécriture | 3,7x (1,23 M d'insertions / 330 000 lignes finales) |
| Ratio test/production | **2,06:1** |

### Ce que ces chiffres signifient

- **Un ratio test/production de 2,06:1** est exceptionnel. La plupart des projets open source tournent autour de 0,3:1. VMark a plus de code de test que de code de production — par un facteur de deux.
- **Un taux de réécriture de 3,7x** signifie que pour chaque ligne dans la base de code finale, 3,7 lignes ont été écrites au total (réécritures, refactorisations et code supprimé inclus). Cela indique une itération significative — pas du « écrire une fois et livrer ».
- **1 993 commits en 84 jours actifs** soit une moyenne de ~24 commits par jour. Le développement assisté par IA produit de nombreux petits commits ciblés.

## Répartition par complexité

Tout le code ne se vaut pas. Une ligne d'analyse de configuration n'est pas la même chose qu'une ligne de code de plugin ProseMirror. On classe la base de code en quatre niveaux de complexité :

| Niveau | Ce qu'il inclut | LOC | Rythme (LOC/jour) |
|--------|-----------------|-----|--------------------|
| **Routine** (1,0x) | JSON i18n, tokens CSS, mises en page, UI des paramètres | 23 000 | 150 |
| **Standard** (1,5x) | Stores, hooks, composants, pont MCP, export, commandes Rust, site web | 52 000 | 100 |
| **Complexe** (2,5x) | Plugins ProseMirror/Tiptap (multi-curseur, mode focus, aperçu de code, UI de tableau, garde IME), intégration CodeMirror, fournisseur IA Rust, MCP server | 30 000 | 50 |
| **Recherche** (4,0x) | Moteur de formatage CJK, système de garde de composition, auto-pair avec détection IME | 4 000 | 25 |

Les rythmes « LOC/jour » supposent un développeur senior écrivant du code testé et vérifié — pas de la sortie brute non revue.

### Pourquoi les plugins d'éditeur coûtent cher

La partie la plus coûteuse de VMark est sans conteste la **couche de plugins ProseMirror/Tiptap** — 34 859 lignes de code qui gèrent les sélections de texte, les transactions documentaires, les vues de nœuds et la composition IME. C'est largement considéré comme la catégorie la plus difficile du développement web :

- On travaille avec un modèle de document, pas un arbre de composants
- Chaque édition est une transaction qui doit préserver l'intégrité du document
- La composition IME (pour la saisie CJK) ajoute une machine à états parallèle complète
- Le multi-curseur nécessite le suivi simultané de N sélections indépendantes
- L'annulation/rétablissement doit fonctionner correctement avec tout ce qui précède

C'est pourquoi la couche de plugins est classée « Complexe » (multiplicateur 2,5x) et le code CJK/IME est classé « Recherche » (4,0x).

## Estimation de l'effort

| Composant | LOC | Jours-dév. |
|-----------|-----|------------|
| Niveau 1 — production (routine) | 23 000 | 153 |
| Niveau 2 — production (standard) | 52 000 | 520 |
| Niveau 3 — production (complexe) | 30 000 | 600 |
| Niveau 4 — production (recherche) | 4 000 | 160 |
| Code de test | 206 077 | 1 374 |
| Documentation (10 langues) | 75 930 | 380 |
| **Sous-total** | | **3 187** |
| Frais généraux (design 5 % + CI 3 % + revue 10 %) | | 574 |
| Surcoût de réécriture (3,7x → +15 %) | | 478 |
| **Total** | | **4 239 jours-développeur** |

Cela représente environ **17 années-personnes** de travail d'ingénierie senior à plein temps.

::: warning Note sur l'effort de test
La suite de tests (206 000 LOC, 17 255 tests) représente **1 374 jours-développeur** — plus d'un tiers de l'effort total. C'est le prix de la discipline test-first du projet. Sans elle, le projet coûterait ~40 % moins cher à construire, mais serait bien plus difficile à maintenir.
:::

## Estimation des coûts

Aux tarifs du marché américain (coûts complets — salaire + avantages + frais généraux) :

| Scénario | Équipe | Durée | Coût |
|----------|--------|-------|------|
| Senior solo (800 $/jour) | 1 personne | 17,7 ans | **3,39 M$** |
| Petite équipe (900 $/jour moy.) | 3 personnes | 2,3 ans | **3,82 M$** |
| Équipe complète (1 000 $/jour moy.) | 5 personnes | 10,6 mois | **4,24 M$** |

Les équipes ne montent pas en charge de façon linéaire. Une équipe de 5 personnes est ~4 fois plus productive qu'une seule personne (pas 5 fois) à cause des frais de communication — c'est la loi de Brooks en action.

## La réalité de l'IA

| Métrique | Valeur |
|----------|--------|
| Durée calendaire réelle | **85 jours** (12 semaines) |
| Équivalent humain | 4 239 jours-développeur (~17 années-personnes) |
| **Multiplicateur de productivité** | **~50x** |
| Coût réel estimé | ~2 000 $ (abonnement Claude Max) |
| Coût équivalent humain (solo) | 3,39 M$ |
| **Réduction des coûts** | **~99,9 %** |

### Ce que signifie le multiplicateur 50x

Cela **ne veut pas dire** que « l'IA est 50 fois plus intelligente qu'un humain ». Cela signifie :

1. **L'IA ne change pas de contexte.** Elle peut garder l'ensemble de la base de code en mémoire et modifier 10 fichiers simultanément.
2. **L'IA écrit des tests à la vitesse de production.** Pour un humain, écrire 17 255 tests est un travail épuisant. Pour l'IA, c'est simplement du code en plus.
3. **L'IA gère le code répétitif instantanément.** La couche de traduction en 10 langues (10 130 LOC de JSON + 320 pages de docs) prendrait des semaines à une équipe humaine. L'IA le fait en minutes.
4. **L'IA ne s'ennuie pas.** Les 656 fichiers de test couvrant les cas limites, la composition IME et le formatage CJK sont exactement le type de travail que les humains ont tendance à négliger.

Le rôle de l'humain était le jugement — *quoi* construire, *quand* s'arrêter, *quelle* approche choisir. Le rôle de l'IA était le travail — écrire, tester, déboguer, traduire.

## Comparaison avec le marché

| Dimension | VMark | Typora | Zettlr | Mark Text |
|-----------|-------|--------|--------|-----------|
| Fonction principale | Markdown WYSIWYG + Source | Markdown WYSIWYG | Markdown académique | Markdown WYSIWYG |
| LOC (est.) | ~109 000 prod. | ~200 000 (code fermé) | ~80 000 | ~120 000 |
| Contributeurs | 2 (1 humain + IA) | 1–2 (fermé) | ~50 | ~100 |
| Âge | **3 mois** | 8+ ans | 6+ ans | 6+ ans |
| Prix | Gratuit (bêta) | Licence à 15 $ | Gratuit / OSS | Gratuit / OSS |
| Différenciateur clé | Natif Tauri, MCP AI, CJK natif, multi-curseur | Finition, export PDF | Zettelkasten, citations | Electron, mature |

### Ce que cette comparaison montre

VMark a atteint une taille de code et un ensemble de fonctionnalités comparables en **85 jours** — ce qui a pris à d'autres projets **6 à 8 ans** avec des équipes de 50 à 100 contributeurs. La discipline de test (17 000 tests, ratio 2:1) dépasse celle de tous les éditeurs Markdown open source de cette comparaison.

Ce n'est pas parce que VMark est « meilleur » — il est plus jeune et moins éprouvé. Mais cela démontre ce que le développement assisté par IA rend possible : une seule personne peut produire un résultat qui nécessitait auparavant une équipe financée.

## Ce qui rend VMark coûteux à construire

Trois facteurs expliquent le coût :

1. **La complexité des plugins d'éditeur** — 34 859 LOC de plugins ProseMirror touchant les sélections, les transactions, les vues de nœuds et la composition IME. C'est du code de niveau 3/4 qu'un spécialiste senior des frameworks d'édition écrirait à ~50 LOC/jour.

2. **Une discipline de test extrême** — Un ratio test/production de 2,06:1 signifie que le code de test seul (206 000 LOC) demande plus d'effort que le code de production. C'est un investissement délibéré — c'est ce qui rend le développement assisté par IA durable.

3. **Une i18n complète en 10 langues** — 320 pages de documentation, 80 fichiers JSON de localisation et un site web entièrement localisé. C'est une échelle opérationnelle qu'on ne voit normalement que dans les produits commerciaux financés, pas dans les projets individuels.

## Reproduire ces chiffres

Toutes les métriques sont reproductibles à partir du dépôt public :

```bash
# Cloner et installer
git clone https://github.com/xiaolai/vmark.git
cd vmark && pnpm install

# Métriques LOC (nécessite tokei : brew install tokei)
tokei --exclude node_modules --exclude dist .

# Historique Git
git log --oneline | wc -l
git log --format='%ai' | awk '{print $1}' | sort -u | wc -l

# Nombre de tests
pnpm vitest run src/ 2>&1 | tail -5
```

::: tip Méthodologie
Les niveaux de référence de productivité (rythmes LOC/jour) utilisés dans cette analyse sont des estimations standard de l'industrie pour des développeurs seniors écrivant du code testé et vérifié. Ils proviennent de la littérature sur l'estimation logicielle (McConnell, Capers Jones) et sont calibrés pour une production de qualité industrielle — pas pour des prototypes ou du code de preuve de concept.
:::
