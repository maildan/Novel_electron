/**
 * 안전한 데이터 저장 모듈
 *
 * Electron의 safeStorage API와 추가 암호화를 사용하여
 * 민감한 데이터를 안전하게 저장하고 관리합니다.
 */
/**
 * 안전한 저장소 초기화
 */
export declare function initializeSecureStorage(): Promise<boolean>;
/**
 * 데이터 안전하게 저장
 */
export declare function storeSecureData(key: string, data: any): Promise<boolean>;
/**
 * 안전하게 저장된 데이터 로드
 */
export declare function loadSecureData(key: string, asJson?: boolean): Promise<any>;
/**
 * 안전하게 저장된 데이터 삭제
 */
export declare function deleteSecureData(key: string): Promise<boolean>;
/**
 * 저장된 데이터 키 목록 조회
 */
export declare function listSecureDataKeys(): Promise<string[]>;
/**
 * 저장소 상태 조회
 */
export declare function getStorageStats(): Promise<{
    isInitialized: boolean;
    totalKeys: number;
    storageSize: number;
    backupCount: number;
}>;
/**
 * 저장소 정리 (오래된 백업 파일 삭제)
 */
export declare function cleanupStorage(maxAge?: number): Promise<number>;
//# sourceMappingURL=safe-storage.d.ts.map