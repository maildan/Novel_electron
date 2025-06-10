"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryManager = void 0;
const electron_1 = require("electron");
const config_1 = require("./config");
class MemoryManager {
    constructor() {
        this.cleanupInterval = null;
        this.monitoringInterval = null;
        this.memoryThreshold = 25; // 25MB로 더욱 대폭 감소
        this.forceGcThreshold = 40; // 40MB로 더욱 대폭 감소
        this.cleanupIntervalMs = 15000; // 15초마다 정리 (더욱 빈번)
        this.lastCleanup = Date.now();
        this.memoryHistory = [];
        this.maxHistorySize = 10; // 히스토리 크기 더욱 감소
        this.aggressiveMode = true; // 적극적 모드 활성화
        this.ultraLowMemoryMode = true; // 초절약 모드 활성화
        this.initialize();
    }
    static getInstance() {
        if (!MemoryManager.instance) {
            MemoryManager.instance = new MemoryManager();
        }
        return MemoryManager.instance;
    }
    /**
     * 메모리 관리자 초기화
     */
    initialize() {
        console.log('[Memory] 메모리 관리자 초기화');
        // 주기적 메모리 정리
        this.startCleanupTimer();
        // 메모리 모니터링
        if (config_1.AppConfig.isDev) {
            this.startMonitoring();
        }
        // 앱 종료 시 정리
        electron_1.app.on('before-quit', () => {
            this.dispose();
        });
        // 메모리 압박 상황 감지
        electron_1.app.on('render-process-gone', (event, webContents, details) => {
            console.warn('[Memory] 렌더러 프로세스 종료:', details);
            if (details.reason === 'oom') {
                this.handleOutOfMemory();
            }
        });
    }
    /**
     * Node.js memoryUsage를 React 컴포넌트가 기대하는 ReactMemoryInfo 형태로 변환 (RSS 기반)
     */
    convertNodeMemoryToMemoryInfo(nodeMemory) {
        const os = require('os');
        const systemTotalMemory = os.totalmem();
        // 바이트를 메가바이트로 정확하게 변환
        const rssMB = Math.round(nodeMemory.rss / (1024 * 1024) * 100) / 100;
        const totalSystemMB = Math.round(systemTotalMemory / (1024 * 1024) * 100) / 100;
        // RSS 기반 계산 (OS 모니터와 일치)
        const used = rssMB; // RSS를 실제 사용 메모리로 사용
        const total = totalSystemMB; // 시스템 전체 메모리를 total로 사용
        const free = Math.max(0, total - used);
        const percentage = total > 0 ? Math.round((used / total) * 100 * 100) / 100 : 0;
        console.log(`[Memory] RSS 기반 메모리 계산: RSS=${rssMB}MB, SystemTotal=${totalSystemMB}MB, Used=${used}MB, Total=${total}MB, Percentage=${percentage}%`);
        return {
            total,
            used,
            free,
            percentage
        };
    }
    /**
     * 현재 메모리 사용량 조회
     */
    getCurrentMemoryUsage() {
        const mainProcess = process.memoryUsage();
        const rendererProcesses = this.getRendererMemoryUsage();
        const systemMemory = this.getSystemMemoryInfo();
        const stats = {
            main: this.convertNodeMemoryToMemoryInfo(mainProcess),
            renderer: rendererProcesses,
            system: systemMemory,
        };
        // GPU 메모리 정보 (가능한 경우)
        try {
            const gpuMemory = this.getGpuMemoryInfo();
            if (gpuMemory) {
                stats.gpu = gpuMemory;
            }
        }
        catch (error) {
            // GPU 메모리 정보를 가져올 수 없는 경우 무시
        }
        return stats;
    }
    /**
     * 렌더러 프로세스 메모리 사용량 조회
     */
    getRendererMemoryUsage() {
        const rendererStats = [];
        electron_1.webContents.getAllWebContents().forEach((contents) => {
            try {
                // Electron의 WebContents.getProcessId()와 process.memoryUsage() 사용
                const processId = contents.getProcessId();
                if (processId) {
                    // 기본 메모리 정보 사용 (실제 프로세스별 메모리는 네이티브 모듈에서 처리)
                    const mainMemory = process.memoryUsage();
                    // 추정값으로 변환 (절반으로 나누어 렌더러 프로세스 추정)
                    const estimatedMemory = {
                        heapUsed: mainMemory.heapUsed / 2,
                        heapTotal: mainMemory.heapTotal / 2,
                        external: mainMemory.external / 2,
                        rss: mainMemory.rss / 2,
                        arrayBuffers: mainMemory.arrayBuffers / 2
                    };
                    rendererStats.push(this.convertNodeMemoryToMemoryInfo(estimatedMemory));
                }
            }
            catch (error) {
                // 메모리 정보를 가져올 수 없는 경우 건너뛰기
            }
        });
        return rendererStats;
    }
    /**
     * 시스템 메모리 정보 조회
     */
    getSystemMemoryInfo() {
        const os = require('os');
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        return {
            total: Math.round(totalMemory / 1024 / 1024),
            free: Math.round(freeMemory / 1024 / 1024),
            used: Math.round(usedMemory / 1024 / 1024),
        };
    }
    /**
     * GPU 메모리 정보 조회 (네이티브 모듈 사용)
     */
    getGpuMemoryInfo() {
        try {
            // 네이티브 모듈에서 GPU 메모리 정보 가져오기
            // 실제 구현은 Rust 네이티브 모듈에서 처리
            return null; // 임시로 null 반환
        }
        catch (error) {
            return null;
        }
    }
    /**
     * 메모리 정리 수행
     */
    async performCleanup(force = false) {
        const now = Date.now();
        // 적극적 모드에서는 더 자주 정리
        const minInterval = this.aggressiveMode ? this.cleanupIntervalMs / 4 : this.cleanupIntervalMs / 2;
        if (!force && now - this.lastCleanup < minInterval) {
            return;
        }
        console.log('[Memory] 적극적 메모리 정리 시작');
        const beforeStats = this.getCurrentMemoryUsage();
        try {
            // 1. 강제 가비지 컬렉션 (여러 번 실행)
            if (global.gc) {
                for (let i = 0; i < 3; i++) {
                    global.gc();
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            // 2. 렌더러 프로세스 적극적 정리
            await this.aggressiveRendererCleanup();
            // 3. 모든 캐시 강제 정리
            await this.aggressiveCacheCleanup();
            // 4. 세션 데이터 정리
            await this.clearSessionData();
            // 5. V8 힙 압축
            if (global.gc && this.aggressiveMode) {
                process.nextTick(() => {
                    if (global.gc)
                        global.gc();
                });
            }
            const afterStats = this.getCurrentMemoryUsage();
            const freedMemory = beforeStats.main.used - afterStats.main.used;
            console.log(`[Memory] 적극적 메모리 정리 완료: ${freedMemory.toFixed(2)}MB 해제`);
            this.lastCleanup = now;
            // 메모리 히스토리 업데이트 (압축)
            this.updateMemoryHistory(afterStats);
        }
        catch (error) {
            console.error('[Memory] 적극적 메모리 정리 실패:', error);
        }
    }
    /**
     * 렌더러 프로세스 메모리 정리
     */
    async cleanupRendererProcesses() {
        const allContents = electron_1.webContents.getAllWebContents();
        for (const contents of allContents) {
            try {
                if (!contents.isDestroyed()) {
                    // DOM 스토리지 정리
                    await contents.session.clearStorageData({
                        storages: ['localstorage', 'websql', 'indexdb'],
                    });
                    // 메모리 압축 요청
                    await contents.executeJavaScript(`
            if (window.gc) {
              window.gc();
            }
            
            // 메모리 최적화
            if (performance && performance.memory) {
              console.log('Memory before cleanup:', performance.memory);
            }
          `);
                }
            }
            catch (error) {
                // 개별 프로세스 정리 실패는 무시
            }
        }
    }
    /**
     * 캐시 정리
     */
    async clearCaches() {
        try {
            const session = require('electron').session.defaultSession;
            // HTTP 캐시 정리
            await session.clearCache();
            // 이미지 캐시 정리 (부분적)
            await session.clearStorageData({
                storages: ['appcache', 'serviceworkers'],
            });
        }
        catch (error) {
            console.error('[Memory] 캐시 정리 실패:', error);
        }
    }
    /**
     * 메모리 부족 상황 처리
     */
    async handleOutOfMemory() {
        console.warn('[Memory] OOM 상황 감지 - 긴급 메모리 정리');
        try {
            // 긴급 정리
            await this.performCleanup(true);
            // 추가 조치
            await this.emergencyCleanup();
        }
        catch (error) {
            console.error('[Memory] 긴급 메모리 정리 실패:', error);
        }
    }
    /**
     * 긴급 메모리 정리
     */
    async emergencyCleanup() {
        try {
            // 불필요한 렌더러 프로세스 종료
            const allContents = electron_1.webContents.getAllWebContents();
            for (const contents of allContents) {
                if (!contents.isDestroyed() && contents.getURL().includes('devtools')) {
                    contents.close();
                }
            }
            // 모든 캐시 강제 정리
            const session = require('electron').session.defaultSession;
            await session.clearStorageData();
        }
        catch (error) {
            console.error('[Memory] 긴급 정리 실패:', error);
        }
    }
    /**
     * 메모리 히스토리 업데이트
     */
    updateMemoryHistory(stats) {
        this.memoryHistory.push(stats);
        // 히스토리 크기 제한
        if (this.memoryHistory.length > this.maxHistorySize) {
            this.memoryHistory.shift();
        }
    }
    /**
     * 메모리 모니터링 시작
     */
    startMonitoring() {
        this.monitoringInterval = setInterval(() => {
            const stats = this.getCurrentMemoryUsage();
            // 임계값 확인 (더 낮은 임계값)
            if (stats.main.used > this.memoryThreshold) {
                console.warn(`[Memory] 메모리 사용량 임계값 초과: ${stats.main.used}MB`);
                this.performCleanup();
            }
            // 강제 GC 임계값 확인 (더 낮은 임계값)
            if (stats.main.used > this.forceGcThreshold) {
                console.warn(`[Memory] 강제 GC 실행: ${stats.main.used}MB`);
                if (global.gc) {
                    global.gc();
                }
            }
            // 메모리 사용량이 30MB를 넘으면 적극적 정리
            if (stats.main.used > 30) {
                console.log('[Memory] 30MB 임계값 초과 - 적극적 정리 실행');
                this.performCleanup(true);
            }
            this.updateMemoryHistory(stats);
        }, 15000); // 15초마다 모니터링 (더 빈번)
    }
    /**
     * 정기 정리 타이머 시작
     */
    startCleanupTimer() {
        this.cleanupInterval = setInterval(() => {
            this.performCleanup();
        }, this.cleanupIntervalMs);
    }
    /**
     * 메모리 통계 조회
     */
    getMemoryStats() {
        const current = this.getCurrentMemoryUsage();
        const history = this.memoryHistory.slice(-20); // 최근 20개
        let averageUsage = 0;
        if (history.length > 0) {
            averageUsage = history.reduce((acc, stats) => acc + stats.main.used, 0) / history.length;
        }
        return { current, history, averageUsage: Math.round(averageUsage) };
    }
    /**
     * 리소스 정리
     */
    dispose() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        console.log('[Memory] 메모리 관리자 정리 완료');
    }
    /**
     * 메모리 사용량 조회 (IPC용)
     */
    async getMemoryUsage() {
        try {
            const stats = this.getCurrentMemoryUsage();
            // 렌더러 프로세스 정보를 하나로 합산
            let totalRendererUsed = 0;
            let totalRendererTotal = 0;
            stats.renderer.forEach(renderer => {
                totalRendererUsed += renderer.used;
                totalRendererTotal += renderer.total;
            });
            const rendererInfo = {
                total: totalRendererTotal,
                used: totalRendererUsed,
                free: totalRendererTotal - totalRendererUsed,
                percentage: totalRendererTotal > 0 ? Math.round((totalRendererUsed / totalRendererTotal) * 100) : 0
            };
            const systemInfo = {
                total: stats.system.total,
                used: stats.system.used,
                free: stats.system.free,
                percentage: Math.round((stats.system.used / stats.system.total) * 100)
            };
            const result = {
                main: stats.main,
                renderer: rendererInfo,
                system: systemInfo,
                timestamp: Date.now()
            };
            if (stats.gpu) {
                result.gpu = {
                    total: stats.gpu.total,
                    used: stats.gpu.used,
                    free: stats.gpu.total - stats.gpu.used,
                    percentage: Math.round((stats.gpu.used / stats.gpu.total) * 100)
                };
            }
            return result;
        }
        catch (error) {
            console.error('[MemoryManager] 메모리 사용량 조회 실패:', error);
            throw error;
        }
    }
    /**
     * 메모리 최적화 실행 (IPC용)
     */
    async optimize() {
        try {
            console.log('[MemoryManager] 메모리 최적화 시작');
            const beforeMemory = await this.getMemoryUsage();
            // 강제 메모리 정리 수행
            await this.performCleanup(true);
            // 잠시 대기 후 메모리 사용량 재측정
            await new Promise(resolve => setTimeout(resolve, 1000));
            const afterMemory = await this.getMemoryUsage();
            const result = {
                before: beforeMemory,
                after: afterMemory,
                freed: {
                    main: beforeMemory.main.used - afterMemory.main.used,
                    renderer: beforeMemory.renderer.used - afterMemory.renderer.used,
                    system: beforeMemory.system.used - afterMemory.system.used
                },
                timestamp: Date.now()
            };
            console.log('[MemoryManager] 메모리 최적화 완료:', result);
            return result;
        }
        catch (error) {
            console.error('[MemoryManager] 메모리 최적화 실패:', error);
            throw error;
        }
    }
    /**
     * 렌더러 프로세스 적극적 정리
     */
    async aggressiveRendererCleanup() {
        const allContents = electron_1.webContents.getAllWebContents();
        for (const contents of allContents) {
            try {
                if (!contents.isDestroyed()) {
                    // 1. 모든 스토리지 데이터 강제 정리
                    await contents.session.clearStorageData({
                        storages: ['localstorage', 'websql', 'indexdb', 'cookies', 'filesystem'],
                    });
                    // 2. 적극적 메모리 압축
                    await contents.executeJavaScript(`
            // 강제 GC 실행 (여러번)
            for(let i = 0; i < 5; i++) {
              if (window.gc) window.gc();
              if (performance.memory && performance.memory.usedJSHeapSize > 50 * 1024 * 1024) {
                console.warn('High memory usage detected, forcing cleanup');
              }
            }
            
            // DOM 정리
            if (document.querySelectorAll) {
              const elements = document.querySelectorAll('*');
              for(let i = 0; i < elements.length; i++) {
                const el = elements[i];
                if (el && el.style) {
                  el.style.cssText = '';
                }
              }
            }
            
            // 이벤트 리스너 정리
            if (window.removeEventListener) {
              ['scroll', 'resize', 'mousemove', 'click'].forEach(event => {
                window.removeEventListener(event, () => {});
              });
            }
          `);
                    // 3. 캐시 강제 정리
                    await contents.session.clearCache();
                }
            }
            catch (error) {
                // 개별 프로세스 정리 실패는 무시하고 계속
                console.warn('[Memory] 개별 렌더러 정리 실패:', error instanceof Error ? error.message : error);
            }
        }
    }
    /**
     * 모든 캐시 적극적 정리
     */
    async aggressiveCacheCleanup() {
        try {
            const session = require('electron').session.defaultSession;
            // 1. 모든 캐시 타입 강제 정리
            await session.clearCache();
            // 2. 모든 스토리지 데이터 정리
            await session.clearStorageData({
                storages: [
                    'appcache', 'cookies', 'filesystem', 'indexdb',
                    'localstorage', 'shadercache', 'websql', 'serviceworkers'
                ],
            });
            // 3. 코드 캐시 정리
            await session.clearCodeCaches({});
            // 4. 호스트 리졸버 캐시 정리
            await session.clearHostResolverCache();
            console.log('[Memory] 적극적 캐시 정리 완료');
        }
        catch (error) {
            console.error('[Memory] 적극적 캐시 정리 실패:', error);
        }
    }
    /**
     * 세션 데이터 정리
     */
    async clearSessionData() {
        try {
            const session = require('electron').session.defaultSession;
            // 1. 모든 세션 관련 데이터 정리
            await session.clearStorageData();
            // 2. 인증 캐시 정리
            await session.clearAuthCache();
            // 3. 코드 캐시 정리
            if (session.clearCodeCaches) {
                await session.clearCodeCaches({});
            }
            console.log('[Memory] 세션 데이터 정리 완료');
        }
        catch (error) {
            console.error('[Memory] 세션 데이터 정리 실패:', error);
        }
    }
}
exports.MemoryManager = MemoryManager;
//# sourceMappingURL=memory.js.map