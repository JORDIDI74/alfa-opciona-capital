# alfa-opciona-capital

Dos cosas conviven en este repositorio:

| Qué | Dónde | Cómo se publica |
| --- | --- | --- |
| Página ALFA OPCIONA CAPITAL | `index.html` | GitHub Pages, desde la raíz |
| Marshall Road Trip · Octubre 2026 | `marshall-road-trip/` | Railway, con el `Dockerfile` de la raíz |

El `Dockerfile` y el `railway.json` de la raíz construyen **solo** la aplicación
de `marshall-road-trip/`; `index.html` no forma parte de la imagen. Los pasos
de despliegue están en [`DEPLOY.md`](DEPLOY.md).
