const express = require('express');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const ROOT_DIR = __dirname;

app.disable('x-powered-by');

const D3_BUNDLE_PATH = path.join(ROOT_DIR, 'node_modules', 'd3', 'dist', 'd3.min.js');
app.get(['/sim/vendor/d3.min.js', '/vendor/d3.min.js'], (_req, res) => {
  res.sendFile(D3_BUNDLE_PATH);
});

app.use(
  express.static(ROOT_DIR, {
    index: ['index.html'],
    extensions: ['html'],
    dotfiles: 'ignore',
    etag: true,
    lastModified: true
  })
);

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use((req, res) => {
  if (req.accepts('html')) {
    return res.sendFile(path.join(ROOT_DIR, 'index.html'));
  }
  return res.status(404).send('Not Found');
});

app.listen(PORT, HOST, () => {
  console.log(`Static server listening at http://${HOST}:${PORT}`);
});
