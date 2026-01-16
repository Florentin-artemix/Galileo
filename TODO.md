# 📋 GALILEO DEPLOYMENT TODO

## Phase 1: Préparation du Serveur
- [ ] Se connecter au serveur SSH: `ssh root@143.110.132.26`
- [ ] Mettre à jour le système: `apt update && apt upgrade -y`
- [ ] Installer Docker et Docker Compose
- [ ] Configurer les permissions Docker
- [ ] Créer la structure de répertoires: `/opt/galileo`

## Phase 2: Transfert du Projet
- [ ] Transférer tous les fichiers du projet vers `/opt/galileo`
- [ ] Transférer les credentials Firebase
- [ ] Créer le fichier `.env`
- [ ] Vérifier les permissions des fichiers

## Phase 3: Configuration
- [ ] Configurer les variables d'environnement Firebase
- [ ] Vérifier la configuration Cloudflare R2
- [ ] Configurer les mots de passe PostgreSQL
- [ ] Ajuster la configuration Elasticsearch

## Phase 4: Déploiement
- [ ] Construire et démarrer tous les services
- [ ] Attendre le démarrage complet (health checks)
- [ ] Vérifier l'état de tous les conteneurs
- [ ] Vérifier les logs pour détecter les erreurs

## Phase 5: Vérification et Tests
- [ ] Tester l'accès au frontend: `http://143.110.132.26:3000`
- [ ] Tester l'API Gateway: `http://143.110.132.26:8080/actuator/health`
- [ ] Tester Elasticsearch: `http://143.110.132.26:9200/_cluster/health`
- [ ] Vérifier les bases de données PostgreSQL
- [ ] Tester l'authentification Firebase

## Phase 6: Configuration Post-Déploiement (Optionnel)
- [ ] Configurer le firewall UFW
- [ ] Mettre en place les sauvegardes automatiques
- [ ] Configurer le monitoring

---
**Serveur**: 143.110.132.26
**Date de début**: $(date)
**Statut**: En cours...
