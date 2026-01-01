---
title: Intégration Kestra (Flows Compatibles)
description: Règles et bonnes pratiques pour créer des flows Kestra compatibles avec l'Onboarding Lovelace.
---

Pour qu'un flow Kestra puisse être piloté par le moteur d'onboarding Lovelace (pattern `KESTRA_JOB_PATTERN`), il doit respecter un contrat d'interface strict.

## Contrat d'Entrée (Inputs)

Le flow **DOIT** déclarer au minimum ces inputs. D'autres inputs peuvent être ajoutés si nécessaire.

```yaml
inputs:
  - id: temporalWorkflowId
    type: STRING
    required: true
    description: "ID du workflow Temporal parent pour le callback"

  - id: guildId  # (Uniquement si plateforme Discord)
    type: STRING
    required: false
  
  - id: appId    # (Uniquement si plateforme Steam)
    type: STRING
    required: false
```

> **Note** : Les IDs de plateforme (`guildId`, `appId`, etc.) sont injectés automatiquement par Temporal si l'étape est liée à une plateforme. Vous n'avez pas à les passer manuellement dans le JSON.

## Logique du Flow

1.  **Stateless** : Le flow ne doit PAS lire la base de données Lovelace pour récupérer sa config. Tout doit passer par les `inputs`.
2.  **Idempotent** : Le flow peut être relancé plusieurs fois sans casser les données.

## Contrat de Sortie (Webhook)

La **DERNIÈRE TÂCHE** du flow (et celle en cas d'erreur) **DOIT** être un appel HTTP vers l'API Lovelace pour signaler la fin du job.

Il est impératif d'utiliser le secret `SYSTEM_USER_ID` pour s'authentifier.

### Tâche de Succès

```yaml
tasks:
  # ... vos tâches ...

  - id: notify_temporal_success
    type: io.kestra.plugin.core.http.Request
    uri: "{{ secret('LOVELACE_API_URL') }}/admin/onboarding/kestra/callback"
    method: POST
    headers:
      x-user-id: "{{ secret('SYSTEM_USER_ID') }}"
    contentType: application/json
    body: |
      {
        "temporalWorkflowId": "{{ inputs.temporalWorkflowId }}",
        "status": "SUCCESS",
        "result": { "message": "Traitement terminé avec succès" }
      }
```

### Tâche d'Erreur (Globale)

```yaml
errors:
  - id: notify_temporal_error
    type: io.kestra.plugin.core.http.Request
    uri: "{{ secret('LOVELACE_API_URL') }}/admin/onboarding/kestra/callback"
    method: POST
    headers:
      x-user-id: "{{ secret('SYSTEM_USER_ID') }}"
    contentType: application/json
    body: |
      {
        "temporalWorkflowId": "{{ inputs.temporalWorkflowId }}",
        "status": "FAILED",
        "result": { "error": "Kestra Flow Failed" }
      }
```

## Configuration Requise dans Kestra

Assurez-vous que ces **Secrets** sont définis dans votre instance Kestra :

*   `LOVELACE_API_URL` : L'URL de votre API (ex: `http://api:3000` ou via Tailscale).
*   `SYSTEM_USER_ID` : L'ID de l'utilisateur système autorisé à appeler l'API.
