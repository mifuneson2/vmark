# Dépannage

## Fichiers journaux

VMark génère des fichiers journaux pour faciliter le diagnostic des problèmes. Les journaux incluent les avertissements et les erreurs provenant du backend Rust et du frontend.

### Emplacement des fichiers journaux

| Plateforme | Chemin |
|------------|--------|
| macOS | `~/Library/Logs/app.vmark/` |
| Windows | `%APPDATA%\app.vmark\logs\` |
| Linux | `~/.local/share/app.vmark/logs/` |

### Niveaux de journalisation

| Niveau | Contenu enregistré | Production | Développement |
|--------|--------------------|------------|---------------|
| Error | Échecs, plantages | Oui | Oui |
| Warn | Problèmes récupérables, solutions de repli | Oui | Oui |
| Info | Jalons, changements d'état | Oui | Oui |
| Debug | Traçage détaillé | Non | Oui |

### Rotation des journaux

- Taille maximale du fichier : 5 Mo
- Rotation : conserve un fichier journal précédent
- Les anciens journaux sont automatiquement remplacés

## Signaler des bugs

Lorsque vous signalez un bug, incluez :

1. **Version de VMark** — affichée dans le badge de la barre de navigation ou dans la boîte de dialogue À propos
2. **Système d'exploitation** — version de macOS, build de Windows ou distribution Linux
3. **Étapes de reproduction** — ce que vous avez fait avant que le problème ne survienne
4. **Fichier journal** — joignez ou collez les entrées de journal pertinentes

Les entrées de journal sont horodatées et identifiées par module (par exemple, `[HotExit]`, `[MCP Bridge]`, `[Export]`), ce qui permet de trouver facilement les sections pertinentes.

### Trouver les journaux pertinents

1. Ouvrez le répertoire des journaux indiqué dans le tableau ci-dessus
2. Ouvrez le fichier `.log` le plus récent
3. Recherchez les entrées `ERROR` ou `WARN` proches du moment où le problème s'est produit
4. Copiez les lignes pertinentes et incluez-les dans votre rapport de bug

## Problèmes courants

### L'application démarre lentement sous Windows

VMark est optimisé pour macOS. Sous Windows, le démarrage peut être plus lent en raison de l'initialisation de WebView2. Vérifiez que :

- WebView2 Runtime est à jour
- Le logiciel antivirus n'analyse pas le répertoire de données de l'application en temps réel

### La barre de menus reste en anglais après un changement de langue

Si la barre de menus reste en anglais après avoir changé la langue dans les Paramètres, redémarrez VMark. Le menu est reconstruit au prochain lancement avec la langue enregistrée.

### Le terminal n'accepte pas la ponctuation CJK

Corrigé dans la version v0.6.5+. Mettez à jour vers la dernière version.
