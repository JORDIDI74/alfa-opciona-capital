# Desplegar en Railway

La aplicación (`marshall-road-trip/`) se sirve como contenedor. El `Dockerfile`
y el `railway.json` están en la **raíz** del repositorio, así que el servicio de
Railway funciona con la configuración por defecto (*Root Directory* = `/`).

## Opción A · Conectar el repositorio (recomendada)

1. En [railway.com](https://railway.com) → **New Project** →
   **Deploy from GitHub repo** → `JORDIDI74/alfa-opciona-capital`.
2. En el servicio, **Settings → Source**: rama
   `claude/audit-improve-railway-deploy-fl8t6z` (o `main` cuando se fusione).
3. Railway detecta el `Dockerfile` de la raíz y lee `railway.json`
   (healthcheck en `/api/health`, reinicio ante fallo).
4. **Settings → Networking → Generate Domain**. Railway inyecta `PORT`; el
   servidor de Next escucha en `0.0.0.0:$PORT` sin más configuración.

No hace falta ninguna variable de entorno. Dos son opcionales:

| Variable | Para qué | Por defecto |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | URL canónica en las etiquetas Open Graph | se deduce de `RAILWAY_PUBLIC_DOMAIN` |
| `NEXT_TELEMETRY_DISABLED` | telemetría de Next | ya viene a `1` en la imagen |

## Opción B · CLI

```bash
npm i -g @railway/cli
railway login
railway link          # o: railway init
railway up            # sube el contexto y construye el Dockerfile
railway domain        # genera el dominio público
```

## Comprobar el despliegue

```bash
curl -fsS https://<tu-dominio>.up.railway.app/api/health
# {"status":"ok","uptime":12}
```

Si el healthcheck falla, los primeros sitios donde mirar son los *Deploy Logs*
del servicio y que el *Root Directory* haya quedado en `/` (el `Dockerfile`
copia desde `marshall-road-trip/`, no desde su propia carpeta).

## Reproducir la imagen en local

```bash
docker build -t marshall-road-trip .
docker run --rm -e PORT=8080 -p 8080:8080 marshall-road-trip
```
