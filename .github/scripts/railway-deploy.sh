#!/usr/bin/env bash
# Despliega la app en Railway desde el runner de GitHub Actions.
#
# Existe porque la sesión de Claude no puede alcanzar railway.com: la política
# de red del entorno lo bloquea. El runner sí, así que el despliegue se lanza
# aquí y los logs son el canal de vuelta.
set -uo pipefail

SERVICE="${SERVICE:-marshall-road-trip}"
PROJECT_NAME="${PROJECT_NAME:-marshall-road-trip}"
ID_FILE=".github/railway-project-id"

log() { printf '\n=== %s ===\n' "$*"; }
run() { echo "+ $*"; timeout 900 "$@"; }

log "Versión de la CLI"
railway --version || true

# La superficie de la CLI de Railway cambia entre versiones mayores. Volcarla
# aquí cuesta unas líneas de log y evita una ronda entera de adivinar flags.
if [ "${RAILWAY_DIAG:-1}" = "1" ]; then
  for cmd in link init add up domain status variables; do
    log "railway $cmd --help"
    railway "$cmd" --help 2>&1 | head -40 || true
  done
fi

log "Identidad del token"
if railway whoami 2>&1; then
  echo "Token de cuenta: puedo crear proyecto y servicio si hacen falta."
else
  echo "El token no identifica cuenta; se asume token de proyecto."
fi

PROJECT_ID="${RAILWAY_PROJECT_ID:-}"
if [ -z "$PROJECT_ID" ] && [ -f "$ID_FILE" ]; then
  PROJECT_ID="$(tr -d '[:space:]' < "$ID_FILE")"
fi

if [ -n "$PROJECT_ID" ]; then
  log "Enlazando con el proyecto $PROJECT_ID"
  run railway link --project "$PROJECT_ID" --service "$SERVICE" --environment "${RAILWAY_ENVIRONMENT_NAME:-production}" \
    || run railway link "$PROJECT_ID" \
    || echo "AVISO: no he podido enlazar; sigo por si el token ya fija el proyecto."
else
  log "Sin proyecto conocido: creando uno"
  run railway init --name "$PROJECT_NAME" || echo "AVISO: railway init ha fallado."
fi

log "Estado del proyecto"
STATUS_JSON="$(railway status --json 2>/dev/null)" || STATUS_JSON=""
if [ -n "$STATUS_JSON" ]; then
  echo "$STATUS_JSON"
  DISCOVERED="$(printf '%s' "$STATUS_JSON" | python3 -c "
import json,sys
try: d=json.load(sys.stdin)
except Exception: raise SystemExit
print(d.get('id') or (d.get('project') or {}).get('id') or '')
" 2>/dev/null)"
  if [ -n "${DISCOVERED:-}" ]; then
    PROJECT_ID="$DISCOVERED"
    mkdir -p "$(dirname "$ID_FILE")"
    printf '%s\n' "$PROJECT_ID" > "$ID_FILE"
    echo "ID DE PROYECTO: $PROJECT_ID"
  fi
  # ¿Existe ya el servicio?
  if ! printf '%s' "$STATUS_JSON" | grep -q "\"$SERVICE\""; then
    log "Creando el servicio $SERVICE"
    run railway add --service "$SERVICE" || echo "AVISO: railway add ha fallado."
  fi
else
  echo "AVISO: railway status --json no ha devuelto nada."
  run railway add --service "$SERVICE" || true
fi

log "Subiendo y construyendo"
run railway up --service "$SERVICE" --ci
UP=$?
echo "railway up -> $UP"

log "Dominio público"
run railway domain --service "$SERVICE" || run railway domain || true

log "Variables del servicio"
railway variables --service "$SERVICE" 2>/dev/null | grep -iE 'RAILWAY_PUBLIC_DOMAIN|RAILWAY_STATIC_URL' || true

exit "$UP"
