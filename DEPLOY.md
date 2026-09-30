# Desplegar en Railway

La aplicación (`marshall-road-trip/`) se sirve como contenedor. El `Dockerfile`
y el `railway.json` están en la **raíz** del repositorio, así que el servicio de
Railway funciona con la configuración por defecto (*Root Directory* = `/`).

## Opción A · Que lo despliegue Claude (recomendada)

Claude no puede alcanzar `railway.com` desde su entorno: la política de red lo
bloquea. Sí puede hacerlo el runner de GitHub Actions, así que el despliegue
vive en `.github/workflows/deploy-railway.yml` y Claude lo lanza empujando a la
rama, lee los logs y corrige si falla.

Hace falta **un secreto, una vez**:

1. En Railway → foto de perfil → **Account Settings → Tokens** → **New Token**.
   Dale un nombre (`github-actions`) y elige el workspace donde quieras que viva
   el proyecto. Copia el token: solo se muestra una vez.
2. En GitHub → el repositorio → **Settings → Secrets and variables → Actions**
   → **New repository secret**.
   - *Name*: `RAILWAY_API_TOKEN`
   - *Secret*: el token que acabas de copiar
3. Avísale a Claude. A partir de ahí el workflow crea el proyecto y el servicio
   si no existen, construye el `Dockerfile`, despliega y genera el dominio
   público, y guarda el ID del proyecto en `.github/railway-project-id` para que
   los despliegues siguientes reutilicen el mismo proyecto.

Si prefieres crear tú el proyecto en Railway y darle solo acceso a ese, usa un
**token de proyecto** (*Project Settings → Tokens*) y guárdalo como
`RAILWAY_TOKEN` en lugar de `RAILWAY_API_TOKEN`. El workflow acepta los dos.

Para forzar un despliegue sin cambiar código, basta con tocar
`.github/deploy-trigger` y hacer push.

### Revocarlo

El token se revoca desde la misma pantalla de Railway donde se creó, y el
secreto se borra en GitHub → *Settings → Secrets and variables → Actions*.

## Opción B · Conectar el repositorio desde el panel

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

## Opción C · CLI en tu máquina

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

## Publicación en GitHub Pages

Además del contenedor, la app se publica como **export estático** dentro del
sitio de Pages que ya sirve este repositorio:

- `https://jordidi74.github.io/alfa-opciona-capital/` → la página de ALFA (`index.html`, intacta)
- `https://jordidi74.github.io/alfa-opciona-capital/viaje/` → el mapa del viaje

Lo hace `.github/workflows/pages-deploy.yml` en cada push a la rama de trabajo:
exporta con `PAGES_EXPORT=1` y `NEXT_PUBLIC_BASE_PATH=/alfa-opciona-capital/viaje`,
copia el resultado a `main:/viaje/` y comprueba después, con un navegador real,
que la URL pública dibuja el mapa.

Dos cosas que conviene saber:

- La página lleva `noindex`, que **sí** funciona ahí. El `robots.txt` **no**:
  los buscadores solo leen el de la raíz del dominio, y esa raíz no es nuestra.
- Es una URL pública. Cualquiera con el enlace ve las fechas y los números de
  vuelo. Para quitarla basta con borrar `viaje/` de `main`.

Para republicar sin tocar código: modifica `.github/pages-trigger` y haz push.

## Reproducir la imagen en local

```bash
docker build -t marshall-road-trip .
docker run --rm -e PORT=8080 -p 8080:8080 marshall-road-trip
```
