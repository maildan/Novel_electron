import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../shared/logger';

export class StaticServer {
  private server: http.Server | null = null;
  private port: number = 0;

  constructor(private staticPath: string, private fallbackPort: number = 5500) {}

  async start(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        this.handleRequest(req, res);
      });

      // 사용 가능한 포트 찾기
      this.server.listen(0, 'localhost', () => {
        const address = this.server?.address();
        if (address && typeof address === 'object') {
          this.port = address.port;
          logger.info(`🌐 정적 서버 시작됨: http://localhost:${this.port}`);
          resolve(this.port);
        } else {
          reject(new Error('서버 주소를 가져올 수 없습니다'));
        }
      });

      this.server.on('error', (error) => {
        logger.error('❌ 정적 서버 에러:', error);
        reject(error);
      });
    });
  }

  private handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    try {
      let filePath = req.url || '/';
      
      // URL에서 쿼리 파라미터 제거
      const urlParts = filePath.split('?');
      filePath = urlParts[0];

      // 루트 경로는 index.html로 리다이렉트
      if (filePath === '/') {
        filePath = '/index.html';
      }

      // API 요청 처리 (기본 JSON 응답)
      if (filePath.startsWith('/api/')) {
        this.handleApiRequest(filePath, res);
        return;
      }

      // 정적 파일 경로 생성
      const fullPath = path.join(this.staticPath, filePath);

      // 파일 존재 확인
      if (!fs.existsSync(fullPath)) {
        // SPA를 위해 존재하지 않는 경로는 index.html로 폴백
        const indexPath = path.join(this.staticPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          this.serveFile(indexPath, res, 'text/html');
        } else {
          this.send404(res);
        }
        return;
      }

      // MIME 타입 결정
      const mimeType = this.getMimeType(path.extname(fullPath));
      this.serveFile(fullPath, res, mimeType);

    } catch (error) {
      logger.error('❌ 요청 처리 에러:', error);
      this.send500(res);
    }
  }

  private handleApiRequest(apiPath: string, res: http.ServerResponse): void {
    // 기본 API 응답들
    const apiResponses: { [key: string]: any } = {
      '/api/health': { status: 'ok', timestamp: Date.now() },
      '/api/native/status': { status: 'loaded', modules: [] },
      '/api/native/memory': { usage: { heapUsed: 0, heapTotal: 0 } }
    };

    const response = apiResponses[apiPath] || { error: 'API not found' };
    
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    
    res.end(JSON.stringify(response));
  }

  private serveFile(filePath: string, res: http.ServerResponse, mimeType: string): void {
    try {
      const content = fs.readFileSync(filePath);
      
      res.writeHead(200, {
        'Content-Type': mimeType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      res.end(content);
    } catch (error) {
      logger.error('❌ 파일 서빙 에러:', error);
      this.send500(res);
    }
  }

  private send404(res: http.ServerResponse): void {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('<h1>404 - 페이지를 찾을 수 없습니다</h1>');
  }

  private send500(res: http.ServerResponse): void {
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end('<h1>500 - 서버 내부 오류</h1>');
  }

  private getMimeType(ext: string): string {
    const mimeTypes: { [key: string]: string } = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject'
    };

    return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          logger.info('🛑 정적 서버 중지됨');
          this.server = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getUrl(): string {
    return `http://localhost:${this.port}`;
  }
}
