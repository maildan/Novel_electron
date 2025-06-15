"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaticServer = void 0;
const http = __importStar(require("http"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const logger_1 = require("../shared/logger");
class StaticServer {
    constructor(staticPath, fallbackPort = 5500) {
        this.staticPath = staticPath;
        this.fallbackPort = fallbackPort;
        this.server = null;
        this.port = 0;
    }
    async start() {
        return new Promise((resolve, reject) => {
            this.server = http.createServer((req, res) => {
                this.handleRequest(req, res);
            });
            // 사용 가능한 포트 찾기
            this.server.listen(0, 'localhost', () => {
                const address = this.server?.address();
                if (address && typeof address === 'object') {
                    this.port = address.port;
                    logger_1.logger.info(`🌐 정적 서버 Started: http://localhost:${this.port}`);
                    resolve(this.port);
                }
                else {
                    reject(new Error('서버 주소를 가져올 수 없습니다'));
                }
            });
            this.server.on('error', (error) => {
                logger_1.logger.error('❌ 정적 서버 에러:', error);
                reject(error);
            });
        });
    }
    handleRequest(req, res) {
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
                }
                else {
                    this.send404(res);
                }
                return;
            }
            // MIME 타입 결정
            const mimeType = this.getMimeType(path.extname(fullPath));
            this.serveFile(fullPath, res, mimeType);
        }
        catch (error) {
            logger_1.logger.error('❌ 요청 처리 에러:', error);
            this.send500(res);
        }
    }
    handleApiRequest(apiPath, res) {
        // 기본 API 응답들
        const apiResponses = {
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
    serveFile(filePath, res, mimeType) {
        try {
            const content = fs.readFileSync(filePath);
            res.writeHead(200, {
                'Content-Type': mimeType,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            res.end(content);
        }
        catch (error) {
            logger_1.logger.error('❌ 파일 서빙 에러:', error);
            this.send500(res);
        }
    }
    send404(res) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - 페이지를 찾을 수 없습니다</h1>');
    }
    send500(res) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>500 - 서버 내부 Error</h1>');
    }
    getMimeType(ext) {
        const mimeTypes = {
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
    async stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    logger_1.logger.info('🛑 정적 서버 Stopped');
                    this.server = null;
                    resolve();
                });
            }
            else {
                resolve();
            }
        });
    }
    getUrl() {
        return `http://localhost:${this.port}`;
    }
}
exports.StaticServer = StaticServer;
//# sourceMappingURL=static-server.js.map