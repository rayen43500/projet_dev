# 🔧 Guide de Dépannage - Caméra/Microphone

## Problème : ❌ Caméra/Micro indisponibles

### Solutions par ordre de priorité :

## 1. 🚨 Permissions Refusées
**Symptôme :** "Permissions refusées. Veuillez autoriser l'accès à la caméra et au microphone."

**Solutions :**
- Cliquez sur le bouton **"Demander les Permissions"**
- Autorisez l'accès dans la popup du navigateur
- Vérifiez les paramètres de confidentialité de votre navigateur
- Redémarrez l'application après avoir accordé les permissions

## 2. 📹 Périphériques Non Trouvés
**Symptôme :** "Caméra ou microphone non trouvé. Vérifiez vos périphériques."

**Solutions :**
- Vérifiez que votre caméra/microphone sont connectés
- Testez vos périphériques dans une autre application (Zoom, Teams, etc.)
- Redémarrez votre ordinateur
- Mettez à jour les pilotes de vos périphériques

## 3. 🔒 Périphériques Déjà Utilisés
**Symptôme :** "Caméra ou microphone déjà utilisé par une autre application."

**Solutions :**
- Fermez toutes les autres applications utilisant la caméra/micro
- Redémarrez l'application de surveillance
- Vérifiez le gestionnaire des tâches pour les processus utilisant la caméra

## 4. 🌐 Serveur Indisponible
**Symptôme :** "Serveur de surveillance indisponible"

**Solutions :**
- Vérifiez que le serveur backend est démarré
- Testez la connexion : `http://localhost:8000/health`
- Redémarrez le serveur backend
- Vérifiez votre connexion réseau

## 5. ⚙️ Paramètres Non Supportés
**Symptôme :** "Paramètres de caméra/microphone non supportés"

**Solutions :**
- Utilisez une caméra/microphone plus récent
- Mettez à jour votre navigateur
- Testez avec des paramètres plus basiques

## 🔍 Vérifications Préalables

### Avant de démarrer la surveillance :
1. **Cliquez sur "Vérifier les Périphériques"**
2. **Autorisez les permissions si demandé**
3. **Vérifiez que tous les indicateurs sont verts**
4. **Démarrez la surveillance**

### En cas de problème persistant :
1. Redémarrez l'application
2. Redémarrez votre ordinateur
3. Testez avec un autre navigateur
4. Contactez le support technique

## 📞 Support Technique

Si le problème persiste après avoir suivi ces étapes :
- Collectez les messages d'erreur affichés
- Notez votre système d'exploitation et navigateur
- Contactez l'équipe de support avec ces informations

---
*Dernière mise à jour : $(Get-Date)*
