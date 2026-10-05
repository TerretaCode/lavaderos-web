#!/usr/bin/env bash
# Recompila y publica la web y la API de contacto en el host.
# Web: nginx sirve dist/ por bind-mount (contenedor lavaderos-web, puerto 8776).
# API: node puro sirve server/app.js por bind-mount (contenedor lavaderos-api, puerto 8777),
#   expuesta en https://lavadero.william-agent.uk/api/* vía ruta en el túnel Cloudflare.
set -euo pipefail
cd /config/lavaderos-ribarroja

npm run build
# rsync (no rm+cp): recrear el directorio deja el bind-mount del contenedor nginx
# apuntando al inodo viejo (sirve "forbidden"/vacío) hasta reiniciarlo.
rsync -a --delete dist/ /host/home/ubuntu/lavaderos-web/dist/

rsync -a server/ /host/home/ubuntu/lavaderos-api/
# El contenedor de la API cachea el código en memoria (require de Node): hace falta
# reiniciarlo para que recoja cambios en app.js. El bind-mount es un solo fichero,
# no un directorio recreado, así que el reinicio es rápido y sin el problema del nginx.
bash /config/jarvis/scripts/jarvis-host.sh 'sudo docker restart lavaderos-api' >/dev/null

echo "Publicado en https://lavadero.william-agent.uk"
