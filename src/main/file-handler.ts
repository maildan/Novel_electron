/**
 * file-handler.ts
 * 
 * 파일 핸들링 기능 제공
 * TODO: 구체적인 파일 처리 로직 구현 필요
 */

import { app, dialog, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

/**
 * 파일 선택 대화상자 표시
 */
export function showOpenDialog(options?: Electron.OpenDialogOptions): Promise<Electron.OpenDialogReturnValue> {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow) {
    return dialog.showOpenDialog(focusedWindow, options || {});
  } else {
    return dialog.showOpenDialog(options || {});
  }
}

/**
 * 파일 저장 대화상자 표시
 */
export function showSaveDialog(options?: Electron.SaveDialogOptions): Promise<Electron.SaveDialogReturnValue> {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow) {
    return dialog.showSaveDialog(focusedWindow, options || {});
  } else {
    return dialog.showSaveDialog(options || {});
  }
}

/**
 * 파일 읽기
 */
export function readFile(filePath: string): Promise<Buffer> {
  return fs.promises.readFile(filePath);
}

/**
 * 파일 쓰기
 */
export function writeFile(filePath: string, data: string | Buffer): Promise<void> {
  return fs.promises.writeFile(filePath, data);
}

/**
 * 앱 데이터 디렉토리에서의 상대 경로 해결
 */
export function resolveAppDataPath(relativePath: string): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, relativePath);
}

/**
 * 안전한 파일 경로 검증
 */
export function validateFilePath(filePath: string): boolean {
  try {
    const normalizedPath = path.normalize(filePath);
    const userDataPath = app.getPath('userData');
    return normalizedPath.startsWith(userDataPath);
  } catch (error) {
    console.error('[file-handler] 파일 경로 검증 실패:', error);
    return false;
  }
}

// 파일 핸들러 초기화
console.log('[file-handler] 파일 핸들러 모듈 로드됨');
console.log('[file-handler] 앱 데이터 경로:', app.getPath('userData'));
