# Fix: Erreur de certificat Docker TLS

## Erreur
```
failed to solve: failed to fetch anonymous token: tls: failed to verify certificate: x509: certificate signed by unknown authority
```

## Solutions (dans l'ordre)

### Solution 1: Redémarrer Docker Desktop (Recommandé)

1. **Arrêter Docker Desktop complètement**
   - Clic droit sur l'icône Docker dans la barre des tâches
   - Cliquez sur "Quit Docker Desktop"
   - Attendez 10 secondes

2. **Redémarrer Docker Desktop**
   - Ouvrez Docker Desktop depuis le menu Démarrer
   - Attendez qu'il soit complètement démarré (icône verte)

3. **Réessayer le build**
   ```powershell
   docker compose build backend
   ```

### Solution 2: Vérifier les paramètres Docker Desktop

1. Ouvrez Docker Desktop
2. Allez dans **Settings** (⚙️) > **Docker Engine**
3. Vérifiez qu'il n'y a pas de configuration incorrecte dans le JSON
4. Si vous voyez des erreurs, cliquez sur **Reset to factory defaults**

### Solution 3: Si vous êtes derrière un proxy d'entreprise

1. Ouvrez Docker Desktop
2. Allez dans **Settings** > **Resources** > **Proxies**
3. Configurez votre proxy :
   - **Web Server (HTTP)**: `http://proxy.company.com:8080`
   - **Secure Web Server (HTTPS)**: `https://proxy.company.com:8080`
   - Si nécessaire, ajoutez les exceptions dans **No Proxy for**

4. Redémarrez Docker Desktop

### Solution 4: Vérifier l'antivirus/firewall

1. **Windows Defender / Antivirus**
   - Ajoutez Docker Desktop aux exceptions
   - Autorisez Docker dans le pare-feu Windows

2. **Firewall d'entreprise**
   - Contactez votre administrateur IT pour autoriser Docker

### Solution 5: Nettoyer et réessayer

```powershell
# Nettoyer le cache Docker
docker builder prune -f

# Réessayer le build
docker compose build backend
```

### Solution 6: Utiliser un miroir Docker (si proxy d'entreprise)

Si vous êtes dans un environnement d'entreprise avec restrictions, vous pouvez configurer un miroir Docker dans Docker Desktop Settings > Docker Engine :

```json
{
  "registry-mirrors": [
    "https://mirror.gcr.io"
  ]
}
```

Puis redémarrez Docker Desktop.

## Vérification

Pour vérifier que Docker peut accéder à Docker Hub :

```powershell
docker pull hello-world
```

Si cette commande fonctionne, le problème est résolu.

