# Docker Build Troubleshooting Guide

## Problem: "failed to receive status: rpc error: code = Unavailable desc = error reading from server: EOF"

This error occurs when Docker's connection to WSL drops during the build export phase.

### Quick Fix (Run as Administrator)

```powershell
# Run the fix script
.\fix-docker-wsl.ps1

# Or manually:
wsl --shutdown
net stop LxssManager
net start LxssManager
```

Then restart Docker Desktop and rebuild.

### Step-by-Step Recovery

1. **Stop Docker Desktop completely**
   - Right-click Docker Desktop icon in system tray → Quit Docker Desktop
   - Wait 10 seconds

2. **Reset WSL**
   ```powershell
   wsl --shutdown
   ```

3. **Restart WSL Service** (Run PowerShell as Administrator)
   ```powershell
   net stop LxssManager
   net start LxssManager
   ```

4. **Check WSL Status**
   ```powershell
   wsl --status
   wsl --list --verbose
   ```

5. **Restart Docker Desktop**

6. **Rebuild with optimized settings**
   ```powershell
   docker-compose build --no-cache backend
   ```

### Docker Desktop Resource Settings

Ensure Docker Desktop has adequate resources:
- **Memory**: At least 4GB (8GB recommended)
- **Disk**: At least 20-30GB free space (60GB recommended for comfortable usage)
- **CPUs**: At least 2 cores

**⚠️ IMPORTANT**: If you have less than 20GB free space, Docker builds will likely fail during export phase.

To check/adjust:
1. Open Docker Desktop
2. Go to Settings → Resources
3. Adjust Memory, CPUs, and Disk Image Size

### Alternative: Build with BuildKit

BuildKit can be more stable for long builds:

```powershell
$env:DOCKER_BUILDKIT=1
docker-compose build backend
```

### If Build Still Fails

1. **Clean Docker system** (removes unused images/containers):
   ```powershell
   docker system prune -a --volumes
   ```

2. **Reset Docker WSL distros** (⚠️ **WARNING**: This deletes all Docker data):
   ```powershell
   wsl --shutdown
   wsl --unregister docker-desktop
   wsl --unregister docker-desktop-data
   ```
   Then restart Docker Desktop (it will recreate the distros).

3. **Check disk space**:
   ```powershell
   Get-PSDrive C | Select-Object Used,Free
   ```

### Prevention Tips

1. **Use multi-stage builds** for large images
2. **Build during off-peak hours** to reduce system load
3. **Close unnecessary applications** during builds
4. **Keep Docker Desktop updated**
5. **Monitor WSL disk usage**: `wsl --list --verbose`

### Build Optimization

The Dockerfile has been optimized with:
- Better layer caching (requirements copied before code)
- Cleaner apt cache
- Separate layers for system vs Python dependencies

This reduces rebuild time when only code changes.

