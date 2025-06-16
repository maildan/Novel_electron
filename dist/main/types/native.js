"use strict";
/**
 * 네이티브 모듈 타입 정의
 *
 * Loop 6에서 사용하는 모든 네이티브 모듈 관련 타입들을 통합 관리합니다.
 * 기존에 electron.d.ts, electron.ts, native-client.ts에 분산되어 있던 타입들을 정리했습니다.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMemoryUsage = isMemoryUsage;
exports.isGpuInfo = isGpuInfo;
exports.isSystemInfo = isSystemInfo;
// 타입 가드 함수들
function isMemoryUsage(obj) {
    return obj &&
        typeof obj.rss === 'string' &&
        typeof obj.heapTotal === 'string' &&
        typeof obj.heapUsed === 'string' &&
        typeof obj.external === 'string' &&
        typeof obj.timestamp === 'string';
}
function isGpuInfo(obj) {
    return obj &&
        typeof obj.vendor === 'string' &&
        typeof obj.name === 'string' &&
        typeof obj.driverVersion === 'string' &&
        typeof obj.memoryMb === 'number';
}
function isSystemInfo(obj) {
    return obj &&
        typeof obj.platform === 'string' &&
        typeof obj.arch === 'string' &&
        typeof obj.cpuCount === 'number' &&
        typeof obj.totalMemory === 'string';
}
//# sourceMappingURL=native.js.map