/**
 * server.js — FinSight Combined Server
 *
 * Serves BOTH the static frontend AND the PaddleOCR proxy on ONE port.
 *
 * ┌──────────────────────────────────────────────────┐
 * │  http://localhost:3001        → index.html (app)  │
 * │  http://localhost:3001/api/ocr → OCR Proxy        │
 * └──────────────────────────────────────────────────┘
 *
 * Start: node server.js
 */

const express = require('express');
const cors    = require('cors');
const https   = require('https');
const path    = require('path');
const url     = require('url');

// ── Credentials ──
const OCR_URL   = process.env.OCR_URL   || 'https://s6f7w0fbb5e2p3q6.aistudio-app.com/layout-parsing';
const OCR_TOKEN = process.env.OCR_TOKEN || 'd425fe68f3ba5591a4e1d1feda4a016a28afd623';

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──
app.use(cors());
app.use(express.json({ limit: '150mb' }));

// ── No-cache headers for JS/CSS ──
app.use((req, res, next) => {
  if (req.path.match(/\.(js|css)$/)) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
  }
  next();
});

// ── Static frontend ──
app.use(express.static(path.join(__dirname), { etag: false, lastModified: false }));

// ── Helper: forward JSON payload to an https URL, returns Promise<{status, body}> ──
function httpsPost(targetUrl, token, bodyObj) {
  return new Promise((resolve, reject) => {
    const bodyStr  = JSON.stringify(bodyObj);
    const parsed   = url.parse(targetUrl);

    const reqOptions = {
      hostname: parsed.hostname,
      path:     parsed.path,
      method:   'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type':  'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
      },
      // No timeout — Document processing needs as long as it needs for large PDFs
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });

    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

// ───────────────────────────────────────────────────────
//  POST /api/ocr  —  OCR Proxy
// ───────────────────────────────────────────────────────
app.post('/api/ocr', async (req, res) => {
  const mbSize = (JSON.stringify(req.body).length / 1024 / 1024).toFixed(1);
  console.log(`[OCR Proxy] Request received — ${mbSize} MB — calling OCR Engine (no timeout)…`);

  const tick = setInterval(() => process.stdout.write('.'), 5000); // heartbeat dots

  try {
    const { status, body } = await httpsPost(OCR_URL, OCR_TOKEN, req.body);
    clearInterval(tick);
    process.stdout.write('\n');

    if (status < 200 || status >= 300) {
      console.error(`[OCR Proxy] OCR Engine error ${status}:`, body.slice(0, 300));
      return res.status(status).json({ error: body });
    }

    console.log(`[OCR Proxy] ✓ OCR Engine responded — status ${status}`);
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(body);

  } catch (err) {
    clearInterval(tick);
    process.stdout.write('\n');
    console.error('[OCR Proxy] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Health check ──
app.get('/api/health', (_, res) => res.json({ status: 'ok', port: PORT }));

// ── Start ──
app.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════╗');
  console.log(`║  FinSight running at                  ║`);
  console.log(`║  → http://localhost:${PORT}             ║`);
  console.log(`║  → POST /api/ocr  (OCR Proxy)        ║`);
  console.log('╚══════════════════════════════════════╝\n');
});
