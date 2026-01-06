# 🔧 Guide - Périphériques Non Détectés

## Situation actuelle :
- ❌ **Caméra** : Non détectée
- ❌ **Microphone** : Non détecté  
- ✅ **Réseau** : Connecté

## Solutions par ordre de priorité :

### 1. 🔍 Vérification des Périphériques Physiques

**Vérifiez d'abord :**
- Caméra connectée et allumée
- Microphone connecté et fonctionnel
- Câbles USB bien branchés
- Périphériques non utilisés par d'autres applications

**Test rapide :**
- Ouvrez l'application Caméra de Windows
- Ouvrez l'application Enregistreur vocal
- Vérifiez que vos périphériques fonctionnent

### 2. 🚨 Demande de Permissions

**Dans l'application :**
1. Cliquez sur **"Vérifier les Périphériques"**
2. Si toujours "Non détecté", cliquez sur **"Demander les Permissions"**
3. **Autorisez** l'accès dans la popup du navigateur
4. Cliquez sur **"Réinitialiser"** puis **"Vérifier les Périphériques"**

### 3. 🔧 Paramètres du Navigateur

**Chrome/Edge :**
- Allez dans `chrome://settings/content/camera`
- Vérifiez que l'accès est autorisé
- Allez dans `chrome://settings/content/microphone`
- Vérifiez que l'accès est autorisé

**Firefox :**
- Allez dans `about:preferences#privacy`
- Section "Permissions" → Caméra et Microphone
- Vérifiez les autorisations

### 4. 🖥️ Paramètres Windows

**Paramètres de confidentialité :**
1. `Paramètres Windows` → `Confidentialité et sécurité`
2. `Caméra` → Autoriser l'accès à la caméra
3. `Microphone` → Autoriser l'accès au microphone
4. Vérifiez que les applications peuvent accéder aux périphériques

### 5. 🔄 Redémarrage et Réinitialisation

**Si rien ne fonctionne :**
1. Fermez toutes les applications utilisant la caméra/micro
2. Redémarrez l'application de surveillance
3. Redémarrez votre ordinateur
4. Testez à nouveau

### 6. 🛠️ Dépannage Avancé

**Console du navigateur (F12) :**
- Ouvrez les outils de développement
- Allez dans l'onglet Console
- Cliquez sur "Vérifier les Périphériques"
- Regardez les messages de log :
  - `Périphériques détectés: [liste]`
  - `Video tracks: [nombre]`
  - `Audio tracks: [nombre]`

**Messages d'erreur courants :**
- `NotAllowedError` → Permissions refusées
- `NotFoundError` → Périphériques non trouvés
- `NotReadableError` → Périphériques déjà utilisés

### 7. 🆘 Solutions Alternatives

**Si les périphériques intégrés ne fonctionnent pas :**
- Testez avec une caméra/microphone USB externe
- Vérifiez les pilotes de vos périphériques
- Mettez à jour votre navigateur
- Testez avec un autre navigateur

## 📞 Support

Si le problème persiste après ces étapes :
1. Notez les messages d'erreur dans la console
2. Indiquez votre système d'exploitation et navigateur
3. Contactez le support technique

---
*Guide créé pour résoudre le problème de détection des périphériques*
