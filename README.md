# Bibliothèque de quartier — Application de gestion

Application complète de gestion d'une bibliothèque de quartier : livres, auteurs, adhérents et emprunts.
Projet réalisé dans le cadre du Module 3 (Backend Node.js, SQL & Express) — Akieni Academy, Cohorte 2.

## Sommaire

- [Stack technique](#stack-technique)
- [Installation](#installation)
- [Structure du projet](#structure-du-projet)
- [Modèle de données et choix de modélisation](#modèle-de-données-et-choix-de-modélisation)
- [Endpoints de l'API](#endpoints-de-lapi)
- [Règles métier principales](#règles-métier-principales)
- [Tests](#tests)

## Stack technique

- **Backend** : Node.js, Express
- **Base de données** : PostgreSQL
- **Frontend** : HTML, CSS, JavaScript (fetch API)
- **Tests manuels** : Postman

## Installation

### Prérequis

- Node.js (v18 ou supérieur recommandé)
- PostgreSQL installé et démarré localement

### Étapes

1. **Cloner le dépôt**
   ```bash
   git clone <url-du-depot>
   cd gestion_de_la_bibliotheque
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Créer la base de données PostgreSQL**
   ```bash
   psql -U postgres -c "CREATE DATABASE bibliotheque;"
   ```

4. **Exécuter le script SQL pour créer les tables**
   ```bash
   psql -U postgres -d bibliotheque -f schema.sql
   ```

5. **Configurer les variables d'environnement**

   Copier `.env.example` vers `.env` et renseigner vos propres valeurs :
   ```bash
   cp .env.example .env
   ```

6. **Démarrer le serveur**
   ```bash
   node main.js
   ```

   Le serveur écoute par défaut sur `http://localhost:3000`.

## Structure du projet

```
gestion_de_la_bibliotheque/
├── config/
│   └── database.js          # Connexion PostgreSQL (pool)
├── controllers/
│   ├── auteurController.js
│   ├── adherentController.js
│   ├── livreController.js
│   ├── empruntController.js
│   └── statistiqueController.js
├── middlewares/
│   ├── auteurValidation.js
│   ├── adherentValidation.js
│   ├── livreValidation.js
│   ├── empruntValidation.js
│   ├── logger.js
│   └── errorHandler.js
├── routes/
│   ├── auteurRoutes.js
│   ├── adherentRoutes.js
│   ├── livreRoutes.js
│   ├── empruntRoutes.js
│   └── statistiqueRoutes.js
├── public/                   # Frontend (HTML/CSS/JS)
│   ├── css/
│   └── js/
├── app.js                    # Configuration Express (middlewares + routes)
├── main.js                   # Point d'entrée (démarrage du serveur)
├── schema.sql                # Script de création des tables
├── .env.example
└── README.md
```

L'architecture sépare strictement trois responsabilités :
- **Routes** : aiguillage uniquement (quelle URL → quel controller).
- **Middlewares** : validation des données entrantes, logging, gestion d'erreurs — exécutés avant les controllers.
- **Controllers** : logique métier et requêtes SQL.

## Modèle de données et choix de modélisation

Quatre tables principales, reliées par des clés étrangères :

- **auteurs** (`id`, `nom`, `nationalite`)
- **adherents** (`id`, `nom`, `contact`)
- **livres** (`id`, `titre`, `auteur_id` → FK, `annee_publication`, `statut`)
- **emprunts** (`id`, `adherent_id` → FK, `livre_id` → FK, `date_emprunt`, `date_retour_prevue`, `date_retour_effective`)

**Choix de modélisation notables :**

- `livres.statut` est un champ dénormalisé (plutôt que déduit par requête à chaque fois), avec la valeur `'disponible'` par défaut et une contrainte `CHECK` limitant les valeurs possibles à `'disponible'` / `'emprunte'`. Ce choix permet un affichage direct du statut dans la liste des livres sans jointure complexe, au prix d'une synchronisation à maintenir côté application (gérée via des transactions SQL lors de la création/du retour d'un emprunt).
- `emprunts.date_retour_effective` est **nullable** : une valeur `NULL` signifie que l'emprunt est encore en cours ; une date renseignée signifie qu'il est clôturé. C'est ce champ qui permet de distinguer les emprunts en cours des emprunts passés sans table ou statut supplémentaire.
- Toutes les suppressions de ressources référencées (`ON DELETE RESTRICT`) sont bloquées si des données dépendantes existent (ex. impossible de supprimer un auteur ayant des livres), afin de préserver l'intégrité de l'historique.
- Un index partiel (`WHERE date_retour_effective IS NULL`) optimise spécifiquement les requêtes sur les emprunts en cours et en retard, les plus fréquentes de l'application.

## Endpoints de l'API

Toutes les routes sont préfixées par `/api`.

| Ressource | Méthode | Route | Description |
|---|---|---|---|
| Auteurs | GET | `/auteurs` | Liste des auteurs |
| | GET | `/auteurs/:id` | Détail d'un auteur |
| | POST | `/auteurs` | Créer un auteur |
| | PUT | `/auteurs/:id` | Modifier un auteur |
| | DELETE | `/auteurs/:id` | Supprimer un auteur |
| Adhérents | GET | `/adherents` | Liste des adhérents |
| | GET | `/adherents/:id` | Détail d'un adhérent |
| | GET | `/adherents/:id/emprunts` | Historique des emprunts d'un adhérent |
| | POST | `/adherents` | Créer un adhérent |
| | PUT | `/adherents/:id` | Modifier un adhérent |
| | DELETE | `/adherents/:id` | Supprimer un adhérent |
| Livres | GET | `/livres` | Liste des livres (supporte `?recherche=&page=&limite=`) |
| | GET | `/livres/:id` | Détail d'un livre |
| | POST | `/livres` | Créer un livre |
| | PUT | `/livres/:id` | Modifier un livre |
| | DELETE | `/livres/:id` | Supprimer un livre |
| Emprunts | GET | `/emprunts` | Liste de tous les emprunts |
| | GET | `/emprunts/en-cours` | Emprunts en cours |
| | GET | `/emprunts/en-retard` | Emprunts en retard |
| | GET | `/emprunts/:id` | Détail d'un emprunt |
| | POST | `/emprunts` | Créer un emprunt |
| | PUT | `/emprunts/:id/retour` | Enregistrer le retour d'un livre |
| Statistiques | GET | `/statistiques` | Totaux, livre le plus emprunté, adhérent le plus actif |

## Règles métier principales

- Un emprunt ne peut pas être créé si le livre concerné est déjà `emprunte`.
- La création d'un emprunt et le passage du livre au statut `emprunte` sont exécutés dans une transaction SQL (`BEGIN`/`COMMIT`/`ROLLBACK`) afin de garantir leur cohérence.
- Un emprunt ne peut pas être supprimé (aucune route `DELETE` n'existe pour cette ressource) : il fait partie de l'historique permanent de la bibliothèque.
- Toute suppression d'auteur, adhérent ou livre référencé ailleurs est bloquée par la base de données et renvoyée comme une erreur `409`.

## Tests

Une collection Postman complète (`bibliotheque.postman_collection.json`) est fournie, couvrant l'ensemble des routes ci-dessus ainsi que plusieurs scénarios d'erreur volontaires (champ obligatoire manquant, référence inexistante, livre déjà emprunté).
