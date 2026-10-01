import { createServer as createHttpServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleApiRequest } from './router.js';

const isDevelopment = process.argv.includes('--dev');
const rootDirectory = fileURLToPath(new URL('..', import.meta.url));
const distributionDirectory = join(rootDirectory, 'dist');
const port = Number(process.env.PORT || (isDevelopment ? 5173 : 4173));
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

let vite;
if (isDevelopment) {
  const { createServer } = await import('vite');
  vite = await createServer({
    appType: 'spa',
    root: rootDirectory,
    server: { middlewareMode: true },
  });
}

const server = createHttpServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
    if (url.pathname.startsWith('/api/')) {
      const handled = await handleApiRequest(request, response, url);
      if (!handled) sendNotFound(response);
      return;
    }

    if (vite) {
      vite.middlewares(request, response, () => sendNotFound(response));
      return;
    }

    await serveProductionFile(url.pathname, response);
  } catch {
    if (!response.headersSent) {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    }
    response.end('Unexpected server error.');
  }
});

server.listen(port, '127.0.0.1', () => {
  const mode = isDevelopment ? 'development' : 'production preview';
  console.log(`Travel Advisor ${mode} server: http://127.0.0.1:${port}`);
});

async function serveProductionFile(pathname, response) {
  const requestedPath = pathname === '/' ? '/index.html' : pathname;
  const safePath = normalize(requestedPath).replace(/^(\.\.[/\\])+/, '');
  let filePath = join(distributionDirectory, safePath);

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) throw new Error('Not a file');
  } catch {
    filePath = join(distributionDirectory, 'index.html');
  }

  const content = await readFile(filePath);
  response.writeHead(200, {
    'Content-Type': mimeTypes[extname(filePath).toLowerCase()] || 'application/octet-stream',
  });
  response.end(content);
}

function sendNotFound(response) {
  response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end('Not found.');
}
