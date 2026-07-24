require('dotenv').config();

const express = require('express');
const http = require('http');
const path = require('path');

const app = express();
const frontendPort = Number(process.env.FRONTEND_PORT || 5173);
const backendPort = Number(process.env.BACKEND_PORT || process.env.PORT || 4000);

app.use('/api', (req, res) => {
  const upstream = http.request({
    hostname: '127.0.0.1',
    port: backendPort,
    path: req.originalUrl,
    method: req.method,
    headers: { ...req.headers, host: `127.0.0.1:${backendPort}` },
  }, (upstreamResponse) => {
    res.status(upstreamResponse.statusCode || 502);
    for (const [name, value] of Object.entries(upstreamResponse.headers)) {
      if (value !== undefined) res.setHeader(name, value);
    }
    upstreamResponse.pipe(res);
  });
  upstream.on('error', () => {
    if (!res.headersSent) res.status(502).json({ error: 'Backend unavailable' });
    else res.end();
  });
  req.pipe(upstream);
});

const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));
app.get('*', (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));
app.listen(frontendPort, '127.0.0.1', () => {
  console.log(`Funeral Home frontend running on port ${frontendPort}`);
});
