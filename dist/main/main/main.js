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
exports.isTest = exports.isProd = exports.isDev = exports.appState = void 0;
/**
 * 메인 프로세스 진입점 - 모듈화된 버전
 */
const electron_1 = require("electron");
const path = __importStar(require("path"));
// 설정 및 초기화 모듈들
const app_config_1 = require("./app-config");
const app_initialization_1 = require("./app-initialization");
Object.defineProperty(exports, "appState", { enumerable: true, get: function () { return app_initialization_1.appState; } });
const app_cleanup_1 = require("./app-cleanup");
// ✅ CRITICAL 중복 수정: 불필요한 중복 import 제거
// app-initialization.ts에서 모든 매니저 초기화를 중앙 관리하므로 
// 개별 import는 제거하고 생명주기 이벤트만 import
// 생명주기 이벤트 전용 (실제 초기화는 app-initialization.ts에서 수행)
require("./app-lifecycle");
// 앱 설정 초기화 (가장 먼저 실행)
(0, app_config_1.initializeAppConfig)();
console.log('Electron main process starting...');
console.log(`Node.js version: ${process.version}`);
console.log(`Electron version: ${process.versions.electron}`);
console.log(`Chrome version: ${process.versions.chrome}`);
console.log(`V8 version: ${process.versions.v8}`);
console.log(`Platform: ${process.platform}`);
console.log(`Architecture: ${process.arch}`);
console.log(`Working directory: ${process.cwd()}`);
console.log(`App path: ${electron_1.app.getAppPath()}`);
console.log(`Environment: ${app_config_1.isDev ? 'development' : 'production'}`);
// 앱 이벤트 핸들러
electron_1.app.whenReady().then(app_initialization_1.onAppReady);
// 모든 창이 닫혔을 때
electron_1.app.on('window-all-closed', () => {
    console.log('All windows closed');
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
// 앱 활성화 (macOS)
electron_1.app.on('activate', async () => {
    console.log('App activated');
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        await (0, app_initialization_1.onAppReady)();
    }
});
// 앱 종료 전
electron_1.app.on('before-quit', async (event) => {
    console.log('App before-quit event received');
    event.preventDefault();
    try {
        await (0, app_cleanup_1.cleanupApplication)(app_initialization_1.appState);
        electron_1.app.exit(0);
    }
    catch (error) {
        console.error('Error during cleanup:', error);
        electron_1.app.exit(1);
    }
});
// 전역 에러 핸들러
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Don't crash the app, just log the error
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't crash the app, just log the error
});
// 개발 모드에서 라이브 리로드 활성화
if (app_config_1.isDev) {
    (async () => {
        try {
            const electronReload = await Promise.resolve().then(() => __importStar(require('electron-reload')));
            electronReload.default(__dirname, {
                electron: path.join(__dirname, '../../../node_modules/.bin/electron'),
                hardResetMethod: 'exit'
            });
        }
        catch (error) {
            console.log('electron-reload not available:', error instanceof Error ? error.message : String(error));
        }
    })();
}
var app_config_2 = require("./app-config");
Object.defineProperty(exports, "isDev", { enumerable: true, get: function () { return app_config_2.isDev; } });
Object.defineProperty(exports, "isProd", { enumerable: true, get: function () { return app_config_2.isProd; } });
Object.defineProperty(exports, "isTest", { enumerable: true, get: function () { return app_config_2.isTest; } });
//# sourceMappingURL=main.js.map