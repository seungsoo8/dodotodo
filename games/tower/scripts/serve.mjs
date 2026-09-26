// 의존성 없는 정적 파일 서버: node scripts/serve.mjs [포트]
// 포트가 이미 쓰이고 있으면 다음 포트(최대 10개)로 넘어간다.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const firstPort = Number(process.argv[2] ?? process.env.PORT ?? 5173);
const MAX_TRIES = 10;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.ttf': 'font/ttf' };

const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname));
  const file = join(root, path.endsWith('/') ? `${path}index.html` : path);
  if (!file.startsWith(root)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const body = await readFile(file);
    // 코드를 고친 뒤 새로고침하면 바로 반영되도록 캐시하지 않는다
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' }).end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});

let port = firstPort;
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE' && port < firstPort + MAX_TRIES - 1) {
    console.log(`${port} 포트는 이미 사용 중이라 ${port + 1} 포트로 시도합니다`);
    port += 1;
    server.listen(port);
    return;
  }
  console.error(`서버를 켜지 못했습니다: ${err.message}`);
  process.exit(1);
});
server.on('listening', () => console.log(`탑 수호자: http://localhost:${port}`));
server.listen(port);
