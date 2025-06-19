"use strict";
/**
 * ⚠️ CRITICAL 중복 수정: 통합된 TypingLogData 타입 정의
 *
 * database.ts와 data-sync.ts에서 서로 다른 구조로 정의된 TypingLogData를 통합합니다.
 *
 * @features
 * - 로컬 데이터베이스용 필드
 * - 원격 동기화용 필드
 * - 타입 안전성 보장
 * - 호환성 유지
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertLocalToRemote = convertLocalToRemote;
exports.convertRemoteToLocal = convertRemoteToLocal;
exports.ensureLocalFormat = ensureLocalFormat;
exports.ensureRemoteFormat = ensureRemoteFormat;
exports.isLocalTypingLogData = isLocalTypingLogData;
exports.isRemoteTypingLogData = isRemoteTypingLogData;
// ===== 변환 유틸리티 =====
/**
 * 로컬 데이터를 원격 동기화 형태로 변환
 */
function convertLocalToRemote(local, userId, sessionId) {
    return {
        userId,
        sessionId,
        keyChar: local.key || '',
        timestamp: typeof local.timestamp === 'string' ? new Date(local.timestamp) :
            local.timestamp instanceof Date ? local.timestamp : new Date(local.timestamp),
        browserName: local.browserName,
        activeWindow: local.windowTitle,
        idempotencyKey: `${userId}-${sessionId}-${Date.now()}`
    };
}
/**
 * 원격 데이터를 로컬 저장 형태로 변환
 */
function convertRemoteToLocal(remote) {
    return {
        key: remote.keyChar,
        keyCount: 1, // 단일 키스트로크
        typingTime: 0, // 개별 키스트로크는 시간 0
        windowTitle: remote.activeWindow,
        browserName: remote.browserName,
        timestamp: remote.timestamp,
        accuracy: undefined
    };
}
/**
 * 일반 TypingLogData를 로컬용으로 변환
 */
function ensureLocalFormat(data) {
    return {
        id: typeof data.id === 'number' ? data.id : undefined,
        key: data.key || data.keyChar || '',
        keyCount: data.keyCount || 1,
        typingTime: data.typingTime || 0,
        windowTitle: data.windowTitle || data.activeWindow,
        browserName: data.browserName,
        appName: data.appName || data.app,
        accuracy: data.accuracy,
        timestamp: typeof data.timestamp === 'string' ? data.timestamp :
            data.timestamp instanceof Date ? data.timestamp :
                new Date(data.timestamp)
    };
}
/**
 * 일반 TypingLogData를 원격용으로 변환
 */
function ensureRemoteFormat(data, userId, sessionId) {
    return {
        _id: typeof data.id === 'string' ? data.id : undefined,
        userId,
        sessionId,
        keyChar: data.keyChar || data.key || '',
        timestamp: typeof data.timestamp === 'string' ? new Date(data.timestamp) :
            data.timestamp instanceof Date ? data.timestamp : new Date(data.timestamp),
        browserName: data.browserName,
        activeWindow: data.activeWindow || data.windowTitle,
        idempotencyKey: data.idempotencyKey || `${userId}-${sessionId}-${Date.now()}`,
        queuedAt: data.queuedAt ? (typeof data.queuedAt === 'string' ? new Date(data.queuedAt) : data.queuedAt) : undefined
    };
}
// ===== 타입 가드 =====
/**
 * 로컬 형태인지 확인
 */
function isLocalTypingLogData(data) {
    return typeof data.keyCount === 'number' && typeof data.typingTime === 'number';
}
/**
 * 원격 형태인지 확인
 */
function isRemoteTypingLogData(data) {
    return typeof data.userId === 'string' && typeof data.sessionId === 'string';
}
//# sourceMappingURL=unified-typing-data.js.map