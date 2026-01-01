---
title: Configuration de l'Onboarding
description: Guide complet pour configurer les étapes d'onboarding, les patterns disponibles et les workflows Temporal.
---

Lovelace utilise un moteur d'onboarding dynamique orchestré par **Temporal**. Les étapes sont définies en base de données et gérées directement depuis l'interface **Admin > Onboarding**.

## Structure d'une Étape (`Step`)

Chaque étape est un objet JSON stocké en base.

```typescript
{
  "slug": "mon-etape-unique",
  "title": "Titre affiché à l'utilisateur",
  "platform": "steam", // ou null pour global
  "executorType": "workflow", // ou "temporal_activity"
  "executorConfig": { ... } // La config spécifique au pattern
}
```

---

## Patterns Disponibles

### 1. Kestra Job Pattern (`KESTRA_JOB_PATTERN`)
Lance un flux de données externe via **Kestra** et attend son achèvement (via webhook).

*   **Usage** : Sync API, Backfill, Traitement lourd.
*   **Comportement** : Temporal injecte automatiquement `guildId` ou `appId` si une plateforme est liée.

```json
{
  "onboardingType": "KESTRA_JOB_PATTERN",
  "params": {
    "flowId": "discord-backfill",      // ID du flow Kestra
    "namespace": "lovelace.ingestion", // Namespace Kestra
    "timeout": "2 hours",              // Optionnel (défaut: 1 hour)
    "inputs": {                        // Inputs statiques additionnels
      "force": true
    }
  }
}
```

👉 **[Voir la documentation Kestra Integration](/guides/kestra-integration)** pour les détails d'implémentation du flow.

### 2. CSV Ingestion Pattern (`CSV_INGESTION_PATTERN`)
Demande à l'utilisateur d'uploader un fichier CSV spécifique.

*   **Usage** : Import de données manuelles (listes de joueurs, mapping legacy).
*   **Comportement** : Met le workflow en pause jusqu'à validation humaine.

```json
{
  "onboardingType": "CSV_INGESTION_PATTERN",
  "params": {
    "label": "Import Joueurs Steam",
    "instructions": "Téléchargez l'export depuis le portail Steamworks.",
    "targetTable": "steam_players",    // Table de destination (info pour le dev)
    "expectedColumns": [
      { "key": "steam_id", "label": "Steam ID" },
      { "key": "playtime", "label": "Temps de jeu" }
    ]
  }
}
```

### 3. Form Pattern (`FORM_PATTERN`)
Affiche un formulaire dynamique à l'utilisateur pour collecter des configurations.

*   **Usage** : Configuration de salons Discord, Rôles, Paramètres métier.
*   **Comportement** : Stocke le résultat dans l'étape (et bientôt directement dans `game_platforms` via `targetAction`).

```json
{
  "onboardingType": "FORM_PATTERN",
  "params": {
    "title": "Configuration Discord",
    "description": "Renseignez les IDs des salons clés.",
    "formSchema": [
      { "key": "welcome_channel_id", "label": "Salon Bienvenue", "type": "text" },
      { "key": "mod_role_id", "label": "Rôle Modérateur", "type": "text" }
    ]
  }
}
```

### 4. Temporal Activity (`temporal_activity`)
Exécute une fonction TypeScript interne définie dans `activities/onboarding.ts`.

*   **Usage** : Actions rapides, Appels API internes, Vérifications.

```json
{
  "activityName": "validatePlatformConfig", // Nom de la fonction dans activities
  "params": {
    "platformSlug": "steam"
  }
}
```

---

## Ajouter une nouvelle étape

Toutes les étapes se gèrent via l'interface **Admin > Onboarding**.
Il suffit de créer une nouvelle entrée et de coller le JSON de configuration correspondant au pattern souhaité.

👉 **[Comprendre le Workflow complet](/guides/onboarding-workflow)**