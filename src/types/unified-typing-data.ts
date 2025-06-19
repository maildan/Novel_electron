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

// ===== 기본 타입 정의 =====

/**
 * 통합된 TypingLogData 인터페이스
 * 로컬 DB와 원격 동기화 모두 지원
 */
export interface TypingLogData {
  // 공통 필드
  id?: number | string;
  timestamp: Date | number | string;
  
  // 키 정보
  key?: string;
  keyChar?: string;
  keyCode?: number;
  
  // 윈도우 정보
  windowTitle?: string;
  activeWindow?: string;
  appName?: string;
  browserName?: string;
  
  // 입력 정보
  shiftKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  
  // 세션 정보 (로컬 DB용)
  keyCount?: number;
  typingTime?: number;
  accuracy?: number;
  wpm?: number;
  window?: string;
  app?: string;
  char?: string;
  
  // 동기화 정보 (원격 동기화용)
  _id?: string;
  idempotencyKey?: string;
  userId?: string;
  sessionId?: string;
  queuedAt?: Date | string;
}

// ===== 특화된 타입 정의 =====

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

// ===== 변환 유틸리티 =====

/**
 * 로컬 데이터를 원격 동기화 형태로 변환
 */
export function convertLocalToRemote(
  local: LocalTypingLogData, 
  userId: string, 
  sessionId: string
): RemoteTypingLogData {
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
export function convertRemoteToLocal(remote: RemoteTypingLogData): LocalTypingLogData {
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
export function ensureLocalFormat(data: TypingLogData): LocalTypingLogData {
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
export function ensureRemoteFormat(
  data: TypingLogData, 
  userId: string, 
  sessionId: string
): RemoteTypingLogData {
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
export function isLocalTypingLogData(data: TypingLogData): data is LocalTypingLogData {
  return typeof data.keyCount === 'number' && typeof data.typingTime === 'number';
}

/**
 * 원격 형태인지 확인
 */
export function isRemoteTypingLogData(data: TypingLogData): data is RemoteTypingLogData {
  return typeof data.userId === 'string' && typeof data.sessionId === 'string';
}

// ===== 호환성 별칭 =====

/**
 * @deprecated database.ts의 기존 TypingLogData와 호환성을 위한 별칭
 */
export type DatabaseTypingLogData = LocalTypingLogData;

/**
 * @deprecated data-sync.ts의 기존 TypingLogData와 호환성을 위한 별칭
 */
export type SyncTypingLogData = RemoteTypingLogData;
