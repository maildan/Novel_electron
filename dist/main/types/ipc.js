"use strict";
/**
 * IPC 관련 타입 정의
 *
 * 모든 IPC 채널의 요청/응답 타입을 중앙 집중식으로 관리합니다.
 * 기존 코드와의 호환성을 유지하면서 점진적으로 타입 안전성을 향상시킵니다.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isIpcResponse = isIpcResponse;
exports.isIpcError = isIpcError;
exports.isValidIpcChannel = isValidIpcChannel;
exports.createSuccessResponse = createSuccessResponse;
exports.createErrorResponse = createErrorResponse;
exports.createIpcError = createIpcError;
const channels_1 = require("../preload/channels");
// =============================================================================
// 타입 가드 함수
// =============================================================================
/**
 * IpcResponse 타입 가드
 */
function isIpcResponse(obj) {
    return (typeof obj === 'object' &&
        obj !== null &&
        typeof obj.success === 'boolean' &&
        typeof obj.timestamp === 'number' &&
        (obj.data === undefined || obj.data !== null) &&
        (obj.error === undefined || typeof obj.error === 'string'));
}
/**
 * IpcError 타입 가드
 */
function isIpcError(obj) {
    return (typeof obj === 'object' &&
        obj !== null &&
        typeof obj.code === 'string' &&
        typeof obj.message === 'string' &&
        (obj.details === undefined || (typeof obj.details === 'object' && obj.details !== null)) &&
        (obj.stack === undefined || typeof obj.stack === 'string'));
}
/**
 * 유효한 IPC 채널인지 확인
 */
function isValidIpcChannel(channel) {
    return Object.values(channels_1.CHANNELS).includes(channel);
}
/**
 * 성공 응답 생성 헬퍼
 */
function createSuccessResponse(data) {
    return {
        success: true,
        data,
        timestamp: Date.now()
    };
}
/**
 * 실패 응답 생성 헬퍼
 */
function createErrorResponse(error) {
    const errorMessage = typeof error === 'string' ? error : error.message;
    return {
        success: false,
        error: errorMessage,
        timestamp: Date.now()
    };
}
/**
 * IpcError 생성 헬퍼
 */
function createIpcError(code, message, details, stack) {
    return {
        code,
        message,
        details,
        stack
    };
}
//# sourceMappingURL=ipc.js.map