# Manuel Administrateur - ProctoFlex AI

## Table des matières
1. [Introduction](#introduction)
2. [Installation et Configuration](#installation-et-configuration)
3. [Gestion des Examens](#gestion-des-examens)
4. [Configuration du Verrouillage](#configuration-du-verrouillage)
5. [Surveillance et Alertes](#surveillance-et-alertes)
6. [Gestion des Comptes](#gestion-des-comptes)
7. [Analyse des Données](#analyse-des-données)
8. [Sécurité et RGPD](#sécurité-et-rgpd)

## 1. Introduction

ProctoFlex AI est une plateforme de surveillance intelligente pour les examens pratiques en ligne. Ce manuel vous guide dans l'utilisation de l'interface administrateur pour configurer et superviser les sessions d'examen.

### 1.1 Fonctionnalités Principales

- **Gestion des examens** : Création, modification et planification
- **Configuration du verrouillage** : Définition des applications autorisées
- **Surveillance en temps réel** : Monitoring des sessions actives
- **Analyse IA** : Détection automatique des comportements suspects
- **Gestion des alertes** : Visualisation et traitement des incidents

## 2. Installation et Configuration

### 2.1 Prérequis Système

- **Système d'exploitation** : Windows 10/11, macOS 12+
- **Navigateur** : Chrome 90+, Firefox 88+, Safari 14+
- **Réseau** : Connexion Internet stable
- **Stockage** : 10 GB d'espace libre minimum

### 2.2 Installation

1. **Téléchargement**
   ```bash
   git clone https://github.com/proctoflex/admin-frontend.git
   cd admin-frontend
   npm install
   ```

2. **Configuration**
   ```bash
   cp .env.example .env
   # Éditer .env avec vos paramètres
   ```

3. **Démarrage**
   ```bash
   npm run dev
   ```

### 2.3 Configuration Initiale

1. **Création du compte administrateur**
   - Accédez à `/setup` lors de la première connexion
   - Remplissez les informations requises
   - Définissez un mot de passe fort

2. **Configuration de la base de données**
   - Connectez-vous à votre instance PostgreSQL
   - Exécutez les migrations : `npm run migrate`
   - Vérifiez la connexion dans les paramètres

## 3. Gestion des Examens

### 3.1 Création d'un Examen

1. **Accédez au tableau de bord**
   - Connectez-vous à l'interface administrateur
   - Cliquez sur "Nouvel Examen"

2. **Informations de base**
   ```
   Nom de l'examen : [Examen Final - Programmation]
   Description : [Examen pratique de programmation Java]
   Durée : [3 heures]
   Date de début : [2025-01-15 09:00]
   Date de fin : [2025-01-15 12:00]
   ```

3. **Configuration de la surveillance**
   - **Niveau de surveillance** : Basique/Standard/Élevé
   - **Vérification d'identité** : Requise/Optionnelle
   - **Enregistrement** : Vidéo/Audio/Écran/Tous

### 3.2 Modification d'un Examen

1. **Accédez à la liste des examens**
2. **Sélectionnez l'examen à modifier**
3. **Modifiez les paramètres souhaités**
4. **Sauvegardez les modifications**

### 3.3 Planification

- **Planification unique** : Examen à une date précise
- **Planification récurrente** : Examen répété (hebdomadaire, mensuel)
- **Fuseaux horaires** : Support multi-fuseaux pour les examens internationaux

## 4. Configuration du Verrouillage

### 4.1 Applications Autorisées

1. **Liste blanche d'applications**
   ```
   Applications autorisées :
   - Visual Studio Code
   - IntelliJ IDEA
   - Eclipse
   - Notepad++
   - Calculator
   ```

2. **Ajout d'applications**
   - Cliquez sur "Ajouter Application"
   - Saisissez le nom du processus
   - Vérifiez la correspondance
   - Sauvegardez

3. **Gestion des processus**
   - **Nom du processus** : Nom exact du fichier .exe
   - **Chemin d'installation** : Chemin complet (optionnel)
   - **Version** : Version spécifique (optionnel)

### 4.2 Domaines Web Autorisés

Pour les examens "open book" :

```
Domaines autorisés :
- docs.oracle.com
- stackoverflow.com
- github.com
- w3schools.com
```

### 4.3 Règles de Verrouillage

1. **Niveau de restriction**
   - **Strict** : Seules les applications listées sont autorisées
   - **Modéré** : Applications listées + système de base
   - **Permissif** : Applications listées + navigateur

2. **Actions automatiques**
   - **Fermeture forcée** : Fermeture immédiate des applications non autorisées
   - **Avertissement** : Notification avant fermeture
   - **Surveillance** : Monitoring sans fermeture

## 5. Surveillance et Alertes

### 5.1 Tableau de Bord en Temps Réel

1. **Sessions actives**
   - Nombre d'étudiants connectés
   - Temps restant par session
   - Statut de la surveillance

2. **Alertes en temps réel**
   - **Rouge** : Incident critique (fraude détectée)
   - **Orange** : Comportement suspect
   - **Jaune** : Avertissement
   - **Vert** : Normal

### 5.2 Types d'Alertes IA

1. **Analyse vidéo**
   - Absence de visage détectée
   - Plusieurs visages détectés
   - Objets suspects (téléphone, tablette)
   - Sortie de champ prolongée

2. **Analyse audio**
   - Voix tierces détectées
   - Chuchotements suspects
   - Bruits anormaux

3. **Analyse d'écran**
   - Ouverture d'applications non autorisées
   - Copier-coller fréquent
   - Changements d'application suspects

### 5.3 Gestion des Alertes

1. **Réponse immédiate**
   - **Interruption** : Arrêt immédiat de l'examen
   - **Avertissement** : Message à l'étudiant
   - **Surveillance renforcée** : Monitoring intensifié

2. **Escalade**
   - **Niveau 1** : Avertissement automatique
   - **Niveau 2** : Intervention administrateur
   - **Niveau 3** : Suspension de session

## 6. Gestion des Comptes

### 6.1 Types d'Utilisateurs

1. **Administrateurs**
   - Accès complet à toutes les fonctionnalités
   - Gestion des comptes utilisateurs
   - Configuration système

2. **Instructeurs**
   - Création et gestion d'examens
   - Surveillance des sessions
   - Analyse des résultats

3. **Étudiants**
   - Accès aux examens assignés
   - Interface de surveillance limitée

### 6.2 Création de Comptes

1. **Import en lot**
   ```csv
   email,nom,prenom,role,groupe
   etudiant1@esprim.tn,Dupont,Jean,student,DS2A
   prof1@esprim.tn,Martin,Pierre,instructor,DS
   ```

2. **Création individuelle**
   - Remplissez le formulaire de création
   - Assignez les rôles appropriés
   - Envoyez les identifiants par email

### 6.3 Gestion des Permissions

1. **Rôles prédéfinis**
   - **Admin** : Toutes les permissions
   - **Instructor** : Gestion d'examens + surveillance
   - **Student** : Participation aux examens

2. **Permissions personnalisées**
   - Création de rôles personnalisés
   - Attribution de permissions spécifiques

## 7. Analyse des Données

### 7.1 Rapports d'Examen

1. **Rapport de session**
   - Durée de connexion
   - Nombre d'alertes
   - Applications utilisées
   - Incidents détectés

2. **Analyse comparative**
   - Comparaison entre sessions
   - Tendances temporelles
   - Statistiques de fraude

### 7.2 Visualisation des Données

1. **Graphiques interactifs**
   - Timeline des alertes
   - Distribution des incidents
   - Performance des étudiants

2. **Export de données**
   - Format CSV pour analyse externe
   - Rapports PDF pour archivage
   - API pour intégration

### 7.3 Intelligence Artificielle

1. **Modèles de détection**
   - Reconnaissance faciale
   - Analyse comportementale
   - Détection de patterns suspects

2. **Amélioration continue**
   - Feedback sur les fausses alertes
   - Ajustement des seuils
   - Apprentissage des nouveaux patterns

## 8. Sécurité et RGPD

### 8.1 Sécurité des Données

1. **Chiffrement**
   - TLS 1.3 pour les communications
   - Chiffrement AES-256 pour le stockage
   - Clés de chiffrement rotatives

2. **Authentification**
   - Authentification multi-facteurs (MFA)
   - Sessions sécurisées
   - Gestion des tentatives de connexion

### 8.2 Conformité RGPD

1. **Consentement**
   - Formulaire de consentement explicite
   - Traçabilité des consentements
   - Droit de retrait

2. **Stockage des données**
   - Localisation en Europe
   - Suppression automatique après 90 jours
   - Anonymisation des données

3. **Droits des utilisateurs**
   - Droit d'accès aux données
   - Droit de rectification
   - Droit à l'effacement
   - Droit à la portabilité

### 8.3 Audit et Conformité

1. **Logs d'audit**
   - Toutes les actions administrateur
   - Accès aux données sensibles
   - Modifications de configuration

2. **Rapports de conformité**
   - Rapports mensuels automatiques
   - Vérification des politiques
   - Mise à jour des procédures

---

## Support et Contact

Pour toute question ou assistance :
- **Email** : support@proctoflex.ai
- **Documentation** : https://docs.proctoflex.ai
- **Téléphone** : +216 XX XXX XXX

**Version** : 1.0.0  
**Dernière mise à jour** : Août 2025  
**Équipe** : ESPRIM - Data Science et Intelligence Artificielle
