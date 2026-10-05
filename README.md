# Lavaderos y Limpiezas

Web de Lavaderos y Limpiezas (Riba-roja de Túria, Valencia). Astro + CSS propio, sin frameworks de UI.

## Desarrollo

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Genera un sitio estático en `dist/`. En Vercel, el framework se detecta automáticamente (build command `npm run build`, output `dist`).

## Configuración

Editar `src/config.ts`:
- `WHATSAPP` / `PHONE` / `PHONE_LABEL`: datos de contacto del cliente.
- `PREVIEW`: `true` mientras la web esté en revisión (añade `noindex` y una etiqueta visible).
- `CONTACT_API`: URL del backend del formulario de contacto (ver `server/app.js`).

## Formulario de contacto

`server/app.js` es una API mínima sin dependencias (Node puro) que guarda los mensajes en disco. Corre en un contenedor aparte (no en Vercel, que no permite almacenamiento persistente en funciones serverless). Ver notas de despliegue en `deploy.sh`.
