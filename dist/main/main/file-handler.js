"use strict";
/**
 * file-handler.ts
 *
 * 파일 핸들링 기능 제공
 * TODO: 구체적인 파일 처리 로직 구현 필요
 */
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
exports.showOpenDialog = showOpenDialog;
exports.showSaveDialog = showSaveDialog;
exports.readFile = readFile;
exports.writeFile = writeFile;
exports.resolveAppDataPath = resolveAppDataPath;
exports.validateFilePath = validateFilePath;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
/**
 * 파일 선택 대화상자 표시
 */
function showOpenDialog(options) {
    const focusedWindow = electron_1.BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
        return electron_1.dialog.showOpenDialog(focusedWindow, options || {});
    }
    else {
        return electron_1.dialog.showOpenDialog(options || {});
    }
}
/**
 * 파일 저장 대화상자 표시
 */
function showSaveDialog(options) {
    const focusedWindow = electron_1.BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
        return electron_1.dialog.showSaveDialog(focusedWindow, options || {});
    }
    else {
        return electron_1.dialog.showSaveDialog(options || {});
    }
}
/**
 * 파일 읽기
 */
function readFile(filePath) {
    return fs.promises.readFile(filePath);
}
/**
 * 파일 쓰기
 */
function writeFile(filePath, data) {
    return fs.promises.writeFile(filePath, data);
}
/**
 * 앱 데이터 디렉토리에서의 상대 경로 해결
 */
function resolveAppDataPath(relativePath) {
    const userDataPath = electron_1.app.getPath('userData');
    return path.join(userDataPath, relativePath);
}
/**
 * 안전한 파일 경로 검증
 */
function validateFilePath(filePath) {
    try {
        const normalizedPath = path.normalize(filePath);
        const userDataPath = electron_1.app.getPath('userData');
        return normalizedPath.startsWith(userDataPath);
    }
    catch (error) {
        console.error('[file-handler] 파일 경로 검증 실패:', error);
        return false;
    }
}
// 파일 핸들러 초기화
console.log('[file-handler] 파일 핸들러 모듈 로드됨');
console.log('[file-handler] 앱 데이터 경로:', electron_1.app.getPath('userData'));
//# sourceMappingURL=file-handler.js.map