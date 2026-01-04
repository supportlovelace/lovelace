---
title: Guide des Plateformes & Identifiants
description: Référentiel des identifiants nécessaires pour connecter les services tiers et activer le scraping.
---

Pour activer le scraping automatique des scores et des données communautaires, chaque plateforme nécessite un identifiant spécifique (Slug ou ID) à renseigner dans la configuration de l'intégration.

---

## 🎮 Metacritic

Metacritic utilise un **slug** textuel présent dans l'URL de la page du jeu.

- **Champ requis** : `slug`
- **Où le trouver** : 
  1. Allez sur [Metacritic](https://www.metacritic.com).
  2. Cherchez votre jeu.
  3. L'identifiant est la partie finale de l'URL : `https://www.metacritic.com/game/`**`destiny-2`**`/`
- **Exemple** : Pour *Destiny 2*, le slug est `destiny-2`.

---

## 📈 OpenCritic

OpenCritic utilise un **identifiant numérique** unique.

- **Champ requis** : `id`
- **Où le trouver** :
  1. Allez sur [OpenCritic](https://opencritic.com).
  2. Cherchez votre jeu.
  3. L'identifiant est le nombre situé après `/game/` dans l'URL : `https://opencritic.com/game/`**`17371`**`/ravenswatch`
- **Exemple** : Pour *Ravenswatch*, l'ID est `17371`.

---

## 🕹️ IGN

IGN utilise un **slug** textuel, souvent proche du nom du jeu.

- **Champ requis** : `slug`
- **Où le trouver** :
  1. Allez sur [IGN](https://www.ign.com).
  2. Cherchez la fiche du jeu.
  3. L'identifiant est la partie finale de l'URL : `https://www.ign.com/games/`**`black-myth-wukong`**
- **Exemple** : Pour *Black Myth: Wukong*, le slug est `black-myth-wukong`.

---

## 🤖 Reddit

Reddit nécessite le nom du subreddit (sans le préfixe /r/).

- **Champ requis** : `subreddit`
- **Où le trouver** :
  1. Allez sur le subreddit du jeu.
  2. L'identifiant est le nom présent dans l'URL : `https://www.reddit.com/r/`**`ravenswatch`**`/`
- **Exemple** : Pour *Ravenswatch*, le subreddit est `ravenswatch`.

---

## 🎮 Steam

Steam utilise l'ID unique de l'application (AppID).

- **Champ requis** : `appId`
- **Où le trouver** :
  1. Allez sur la page du jeu dans le magasin Steam.
  2. L'identifiant est le nombre présent après `/app/` dans l'URL : `https://store.steampowered.com/app/`**`1235140`**`/Ravenswatch/`
- **Exemple** : Pour *Ravenswatch*, l'AppID est `1235140`.

---

## 🎮 Epic Games Store

Epic Games utilise un **slug** présent dans l'URL de la page produit.

- **Champ requis** : `slug`
- **Où le trouver** :
  1. Allez sur la page du jeu sur l'Epic Games Store.
  2. L'identifiant est la partie finale de l'URL : `https://store.epicgames.com/en-US/p/`**`black-myth-wukong`**
- **Note importante** : Certains jeux ont un slug complexe avec un hash à la fin (ex: `football-manager-26-080e85`). Veillez à bien copier toute la partie après `/p/`.
- **Exemple** : Pour *Destiny 2*, le slug est `destiny-2`.

---

## 💬 Discord

Pour les intégrations Discord (canaux, rôles, membres), Lovelace utilise l'ID unique du serveur (Guild ID).

- **Champ requis** : `guildId`
- **Où le trouver** :
  1. Dans Discord, activez le **Mode Développeur** (Paramètres > Avancés).
  2. Faites un clic droit sur l'icône de votre serveur dans la barre latérale.
  3. Cliquez sur **Copier l'identifiant du serveur**.
- **Alternative** : Dans l'interface Admin Lovelace, le sélecteur de serveurs Discord affiche automatiquement les serveurs où le bot est présent.

---

## ⚙️ Comment configurer ?

1. Rendez-vous dans **Structure > Jeux**.
2. Sélectionnez votre jeu.
3. Allez dans l'onglet **Intégrations**.
4. Cliquez sur **Ajouter une intégration** ou modifiez l'existante.
5. Renseignez l'identifiant dans le champ **Configuration (JSON)** au format suivant :

```json
{
  "slug": "votre-slug-ici"
}
```
*(Remplacez `"slug"` par `"id"` pour OpenCritic)*.
