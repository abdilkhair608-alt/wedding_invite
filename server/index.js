import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRsvpHandler } from './rsvp-api.js';
import { projectRoot, serverConfig } from './config.js';

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

export function createApp(config = serverConfig()) {
  const api = createRsvpHandler(config);
  const directory = path.join(projectRoot, 'dist');

  function serve(request, response) {
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    } catch {
      response.writeHead(400).end();
      return;
    }
    if (pathname.startsWith('/api/') || pathname.includes('\0')) {
      response.writeHead(404).end();
      return;
    }
    let file = path.resolve(directory, `.${pathname}`);
    if (!file.startsWith(`${directory}${path.sep}`) && file !== directory) {
      response.writeHead(403).end();
      return;
    }
    if (!path.extname(pathname)) file = path.join(directory, 'index.html');
    let stat;
    try {
      stat = fs.statSync(file);
    } catch {
      response.writeHead(404).end('File tidak ditemukan. Jalankan npm run build terlebih dahulu.');
      return;
    }
    if (!stat.isFile()) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, {
      'Content-Type': types[path.extname(file)] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': pathname.startsWith('/assets/')
        ? 'public, max-age=31536000, immutable'
        : 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });
    if (request.method === 'HEAD') {
      response.end();
      return;
    }
    const stream = fs.createReadStream(file);
    stream.on('error', () => response.destroy());
    stream.pipe(response);
  }

  const server = createServer((request, response) => {
    api(request, response, () => serve(request, response));
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 15000;
  return server;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '127.0.0.1';
  const server = createApp();
  server.listen(port, host, () => console.log(`Undangan berjalan di http://${host}:${port}`));
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => server.close(() => process.exit(0)));
  }
}
