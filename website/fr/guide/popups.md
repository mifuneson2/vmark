# Fenêtres contextuelles en ligne

VMark fournit des fenêtres contextuelles pour modifier les liens, images, médias, maths, notes de bas de page et plus encore. Ces fenêtres fonctionnent en modes WYSIWYG et Source avec une navigation clavier cohérente.

## Raccourcis clavier communs

Toutes les fenêtres contextuelles partagent ces comportements clavier :

| Action | Raccourci |
|--------|----------|
| Fermer/Annuler | `Échap` |
| Confirmer/Enregistrer | `Entrée` |
| Naviguer entre les champs | `Tab` / `Shift + Tab` |

## Infobulle et fenêtre contextuelle de lien

VMark utilise un système à deux niveaux pour les liens : une infobulle en lecture seule au survol, et une fenêtre contextuelle d'édition via raccourci clavier.

### Infobulle au survol (lecture seule)

**Déclencheur :** Survoler le lien (délai de 300ms)

**Affiche :**
- **Aperçu de l'URL** — URL tronquée avec URL complète au survol
- **Bouton Ouvrir** — Ouvre le lien dans le navigateur (ou accède au titre pour les `#signets`)

**Comportement :** Vue uniquement. Éloignez la souris pour fermer.

### Modifier un lien existant

**Déclencheur :** Placez le curseur dans un lien + `Mod + K`

**Champs :**
- **URL** — Modifier la destination du lien
- **Ouvrir** — Ouvrir le lien dans le navigateur
- **Copier** — Copier l'URL dans le presse-papiers
- **Supprimer** — Supprimer le lien, conserver le texte

### Créer un nouveau lien

**Déclencheur :** Sélectionnez du texte + `Mod + K`

**Presse-papiers intelligent :** Si votre presse-papiers contient une URL, elle est remplie automatiquement.

**Champs :**
- **Saisie d'URL** — Entrez la destination
- **Confirmer** — Appuyez sur Entrée ou cliquez sur ✓
- **Annuler** — Appuyez sur Échap ou cliquez sur ✗

### Mode Source

- **`Cmd + Clic`** sur le lien → ouvre dans le navigateur
- **Clic** sur la syntaxe `[texte](url)` → affiche la fenêtre contextuelle d'édition
- **`Mod + K`** à l'intérieur du lien → affiche la fenêtre contextuelle d'édition

::: tip Liens signet
Les liens commençant par `#` sont traités comme des signets (liens de titre internes). Ouvrir accède au titre au lieu d'ouvrir un navigateur.
:::

## Fenêtre contextuelle multimédia (Images, Vidéo, Audio)

Une fenêtre contextuelle unifiée pour modifier tous les types de médias — images, vidéo et audio.

### Fenêtre contextuelle d'édition

**Déclencheur :** Double-cliquez sur n'importe quel élément multimédia (image, vidéo ou audio)

**Champs communs (tous les types de médias) :**
- **Source** — Chemin du fichier ou URL

**Champs spécifiques au type :**

| Champ | Image | Vidéo | Audio |
|-------|-------|-------|-------|
| Texte alternatif | Oui | — | — |
| Titre | — | Oui | Oui |
| Couverture | — | Oui | — |
| Dimensions | Lecture seule | — | — |
| Basculer en ligne/bloc | Oui | — | — |

**Boutons :**
- **Parcourir** — Sélectionner un fichier depuis le système de fichiers
- **Copier** — Copier le chemin source dans le presse-papiers
- **Supprimer** — Supprimer l'élément multimédia

**Raccourcis :**
- `Mod + Shift + I` — Insérer une nouvelle image
- `Entrée` — Enregistrer les modifications
- `Échap` — Fermer la fenêtre contextuelle

### Mode Source

En mode Source, cliquer sur la syntaxe d'image `![alt](chemin)` ouvre la même fenêtre contextuelle multimédia. Les fichiers médias (extensions vidéo/audio) affichent une prévisualisation flottante avec des contrôles de lecture natifs au survol.

## Menu contextuel d'image

Un clic droit sur une image en mode WYSIWYG ouvre un menu contextuel avec des actions rapides (séparé de la fenêtre contextuelle de modification par double-clic).

**Déclencheur :** Clic droit sur n'importe quelle image

**Actions :**
| Action | Description |
|--------|-------------|
| Changer l'image | Ouvrir un sélecteur de fichiers pour remplacer l'image |
| Supprimer l'image | Supprimer l'image du document |
| Copier le chemin | Copier le chemin source de l'image dans le presse-papiers |
| Révéler dans le Finder | Ouvrir l'emplacement du fichier image dans votre gestionnaire de fichiers (le libellé s'adapte selon la plateforme) |

Appuyez sur `Échap` pour fermer le menu contextuel sans effectuer d'action.

## Fenêtre contextuelle mathématique

Modifier les expressions mathématiques LaTeX avec une prévisualisation en direct.

**Déclencheur :**
- **WYSIWYG :** Cliquer sur les maths en ligne `$...$`
- **Source :** Placer le curseur à l'intérieur de `$...$`, `$$...$$` ou de blocs ` ```latex `

**Champs :**
- **Saisie LaTeX** — Modifier l'expression mathématique
- **Prévisualisation** — Aperçu rendu en temps réel
- **Affichage d'erreur** — Affiche les erreurs LaTeX avec des suggestions de syntaxe utiles

**Raccourcis :**
- `Mod + Entrée` — Enregistrer et fermer
- `Échap` — Annuler et fermer
- `Shift + Retour arrière` — Supprimer les maths en ligne (fonctionne même si non vide, WYSIWYG uniquement)
- `Alt + Mod + M` — Insérer de nouvelles maths en ligne

::: tip Suggestions d'erreur
Lorsque vous avez une erreur de syntaxe LaTeX, la fenêtre contextuelle affiche des suggestions utiles comme les accolades manquantes, les commandes inconnues ou les délimiteurs non équilibrés.
:::

::: info Mode Source
Le mode Source propose la même fenêtre contextuelle de maths modifiable que le mode WYSIWYG — une zone de texte pour la saisie LaTeX avec un aperçu KaTeX en direct en dessous. La fenêtre s'ouvre automatiquement lorsque le curseur entre dans une syntaxe mathématique (`$...$`, `$$...$$` ou ` ```latex `). Appuyez sur `Mod + Entrée` pour enregistrer ou `Échap` pour annuler.
:::

## Fenêtre contextuelle de note de bas de page

Modifier le contenu des notes de bas de page en ligne.

**Déclencheur :**
- **WYSIWYG :** Survoler la référence de note de bas de page `[^1]`

**Champs :**
- **Contenu** — Texte de note de bas de page multiligne (redimensionnement automatique)
- **Aller à la définition** — Accéder à la définition de la note de bas de page
- **Supprimer** — Supprimer la note de bas de page

**Comportement :**
- Les nouvelles notes de bas de page mettent automatiquement au point le champ de contenu
- La zone de texte se développe au fil de la saisie

## Fenêtre contextuelle de lien wiki

Modifier les liens de style wiki pour les connexions internes de documents.

**Déclencheur :**
- **WYSIWYG :** Survoler `[[cible]]` (délai de 300ms)
- **Source :** Cliquer sur la syntaxe de lien wiki

**Champs :**
- **Cible** — Chemin relatif à l'espace de travail (l'extension `.md` est gérée automatiquement)
- **Parcourir** — Sélectionner un fichier depuis l'espace de travail
- **Ouvrir** — Ouvrir le document lié
- **Copier** — Copier le chemin cible
- **Supprimer** — Supprimer le lien wiki

## Menu contextuel de tableau

Actions d'édition rapides pour les tableaux.

**Déclencheur :**
- **WYSIWYG :** Utiliser la barre d'outils ou les raccourcis clavier
- **Source :** Clic droit sur une cellule de tableau

**Actions :**
| Action | Description |
|--------|-------------|
| Insérer une ligne au-dessus/en-dessous | Ajouter une ligne au curseur |
| Insérer une colonne à gauche/droite | Ajouter une colonne au curseur |
| Supprimer la ligne | Supprimer la ligne actuelle |
| Supprimer la colonne | Supprimer la colonne actuelle |
| Supprimer le tableau | Supprimer l'intégralité du tableau |
| Aligner la colonne à gauche/centre/droite | Définir l'alignement pour la colonne actuelle |
| Aligner tout à gauche/centre/droite | Définir l'alignement pour toutes les colonnes |
| Formater le tableau | Aligner automatiquement les colonnes du tableau (embellir le markdown) |

## Fenêtre contextuelle de vérification orthographique

Corriger les erreurs orthographiques avec des suggestions.

**Déclencheur :**
- Clic droit sur un mot mal orthographié (souligné en rouge)

**Actions :**
- **Suggestions** — Cliquer pour remplacer par la suggestion
- **Ajouter au dictionnaire** — Arrêter de marquer comme mal orthographié

## Comparaison des modes

| Élément | Édition WYSIWYG | Source |
|---------|-----------------|--------|
| Lien | Infobulle au survol / `Mod+K` | Clic / `Mod+K` / `Cmd+Clic` pour ouvrir |
| Image | Double-clic | Clic sur `![](chemin)` |
| Vidéo | Double-clic | — |
| Audio | Double-clic | — |
| Maths | Clic | Curseur dans les maths → popup |
| Note de bas de page | Survol | Édition directe |
| Lien wiki | Survol | Clic |
| Tableau | Barre d'outils | Menu clic droit |
| Vérification orthographique | Clic droit | Clic droit |

## Conseils de navigation dans les fenêtres contextuelles

### Flux de focus
1. La fenêtre contextuelle s'ouvre avec la première entrée mise au point
2. `Tab` se déplace vers l'avant dans les champs et boutons
3. `Shift + Tab` se déplace vers l'arrière
4. Le focus se boucle à l'intérieur de la fenêtre contextuelle

### Édition rapide
- Pour les modifications d'URL simples : modifiez et appuyez sur `Entrée`
- Pour annuler : appuyez sur `Échap` depuis n'importe quel champ
- Pour le contenu multiligne (notes de bas de page, maths) : utilisez `Mod + Entrée` pour enregistrer

### Comportement de la souris
- Cliquer en dehors de la fenêtre contextuelle pour fermer (les modifications sont ignorées)
- Les fenêtres contextuelles au survol (lien, note de bas de page, wiki) ont un délai de 300ms avant l'affichage
- Ramener la souris vers la fenêtre contextuelle la maintient ouverte

<!-- Styles in style.css -->
