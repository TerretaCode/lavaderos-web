// API mínima del formulario de contacto. Sin dependencias: solo el módulo http de Node.
// Guarda cada mensaje en /data/contacts.jsonl (persistente) y expone un listado protegido por token.
const http = require('http');
const fs = require('fs');
const path = require('path');

const DATA_DIR = '/data';
const DATA_FILE = path.join(DATA_DIR, 'contacts.jsonl');
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const MAX_BODY = 20_000;

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function readSubmissions() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return fs
    .readFileSync(DATA_FILE, 'utf8')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = new URL(req.url, 'http://internal');

  if (req.method === 'POST' && url.pathname === '/api/contact') {
    let body = '';
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) { req.destroy(); return; }
      body += chunk;
    });
    req.on('end', () => {
      if (req.destroyed) return;
      let data;
      try { data = JSON.parse(body); } catch { return sendJson(res, 400, { ok: false, error: 'JSON inválido' }); }

      // honeypot: si el campo oculto viene relleno, es un bot. Respondemos ok sin guardar nada.
      if (data.web_hp) return sendJson(res, 200, { ok: true });

      const nombre = String(data.nombre || '').trim().slice(0, 120);
      const contacto = String(data.contacto || '').trim().slice(0, 160);
      const servicio = String(data.servicio || '').trim().slice(0, 80);
      const mensaje = String(data.mensaje || '').trim().slice(0, 2000);

      if (!nombre || !contacto || !mensaje) {
        return sendJson(res, 400, { ok: false, error: 'Faltan campos obligatorios' });
      }

      const entry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        fecha: new Date().toISOString(),
        nombre,
        contacto,
        servicio,
        mensaje,
      };
      fs.appendFileSync(DATA_FILE, JSON.stringify(entry) + '\n');
      return sendJson(res, 200, { ok: true });
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/contact/list') {
    if (!ADMIN_TOKEN || url.searchParams.get('token') !== ADMIN_TOKEN) {
      return sendJson(res, 401, { ok: false, error: 'No autorizado' });
    }
    const mensajes = readSubmissions().reverse();
    if (url.searchParams.get('format') === 'json') {
      return sendJson(res, 200, { ok: true, count: mensajes.length, mensajes });
    }
    const rows = mensajes
      .map(
        (m) =>
          `<tr><td>${escapeHtml(new Date(m.fecha).toLocaleString('es-ES', { timeZone: 'Europe/Madrid' }))}</td><td>${escapeHtml(m.nombre)}</td><td>${escapeHtml(m.contacto)}</td><td>${escapeHtml(m.servicio || '—')}</td><td>${escapeHtml(m.mensaje)}</td></tr>`
      )
      .join('');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Mensajes · Lavaderos y Limpiezas</title><style>
      body{font-family:system-ui,-apple-system,sans-serif;background:#07131c;color:#eaf2f8;padding:28px;margin:0}
      h1{font-size:19px;font-weight:700;margin:0 0 18px}
      table{width:100%;border-collapse:collapse;font-size:14px}
      td,th{padding:10px 14px;border-bottom:1px solid #1c2a35;text-align:left;vertical-align:top}
      th{color:#9bb0c0;font-size:11.5px;text-transform:uppercase;letter-spacing:.06em}
      tr:hover td{background:#0f1c26}
      @media(max-width:700px){table,thead,tbody,tr,td{display:block}th{display:none}td{border:none;padding:4px 0}tr{padding:14px 0;border-bottom:1px solid #1c2a35}td::before{content:attr(data-l);display:block;color:#6f8599;font-size:11px;text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px}}
    </style></head><body><h1>Mensajes recibidos (${mensajes.length})</h1><table><tr><th>Fecha</th><th>Nombre</th><th>Contacto</th><th>Servicio</th><th>Mensaje</th></tr>${rows || '<tr><td colspan="5">Sin mensajes todavía.</td></tr>'}</table></body></html>`);
    return;
  }

  sendJson(res, 404, { ok: false, error: 'No encontrado' });
});

server.listen(3000, () => console.log('lavaderos-api escuchando en :3000'));
