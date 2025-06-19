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
/**
 * 통합된 TypingLogData 인터페이스
 * 로컬 DB와 원격 동기화 모두 지원
 */
export interface TypingLogData {
    id?: number | string;
    timestamp: Date | number | string;
    key?: string;
    keyChar?: string;
    keyCode?: number;
    windowTitle?: string;
    activeWindow?: string;
    appName?: string;
    browserName?: string;
    shiftKey?: boolean;
    ctrlKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
    keyCount?: number;
    typingTime?: number;
    accuracy?: number;
    wpm?: number;
    window?: string;
    app?: string;
    char?: string;
    _id?: string;
    idempotencyKey?: string;
    userId?: string;
    sessionId?: string;
    queuedAt?: Date | string;
}
/**
 * 로컬 데이터베이스 전용 TypingLogData
 */
export interface LocalTypingLogData extends TypingLogData {
    id?: number;
    keyCount: number;
    typingTime: number;
    windowTitle?: string;
    browserName?: string;
    appName?: string;
    accuracy?: number;
    timestamp: string | Date;
}
/**
 * 원격 동기화 전용 TypingLogData
 */
export interface RemoteTypingLogData extends TypingLogData {
    _id?: string;
    idempotencyKey?: string;
    userId: string;
    sessionId: string;
    keyChar: string;
    timestamp: Date;
    browserName?: string;
    activeWindow?: string;
    queuedAt?: Date;
}
/**
 * 로컬 데이터를 원격 동기화 형태로 변환
 */
export declare function convertLocalToRemote(local: LocalTypingLogData, userId: string, sessionId: string): RemoteTypingLogData;
/**
 * 원격 데이터를 로컬 저장 형태로 변환
 */
export declare function convertRemoteToLocal(remote: RemoteTypingLogData): LocalTypingLogData;
/**
 * 일반 TypingLogData를 로컬용으로 변환
 */
export declare function ensureLocalFormat(data: TypingLogData): LocalTypingLogData;
/**
 * 일반 TypingLogData를 원격용으로 변환
 */
export declare function ensureRemoteFormat(data: TypingLogData, userId: string, sessionId: string): RemoteTypingLogData;
/**
 * 로컬 형태인지 확인
 */
export declare function isLocalTypingLogData(data: TypingLogData): data is LocalTypingLogData;
/**
 * 원격 형태인지 확인
 */
export declare function isRemoteTypingLogData(data: TypingLogData): data is RemoteTypingLogData;
/**
 * @deprecated database.ts의 기존 TypingLogData와 호환성을 위한 별칭
 */
export type DatabaseTypingLogData = LocalTypingLogData;
/**
 * @deprecated data-sync.ts의 기존 TypingLogData와 호환성을 위한 별칭
 */
export type SyncTypingLogData = RemoteTypingLogData;
//# sourceMappingURL=unified-typing-data.d.ts.map